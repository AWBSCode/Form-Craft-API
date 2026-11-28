const mongoose = require('mongoose');
const Response = require('../models/responseModel');
const Form = require('../models/formModel');
const validateSubmission = require('../utils/validateResSubmit');
const AppError = require('../utils/AppError');

exports.postResponse = async (req, res) => {
    const { slug } = req.params;
    const { answers } = req.body || {};

    // 1. Read-only fetch with .lean()
    const form = await Form.findOne({
        slug,
        status: 'published'
    }).lean();

    if (!form) {
        return res.status(404).json({
            status: 'fail',
            message: 'The form is not found or closed.'
        });
    }

    const maxResponses = form.settings?.maxResponses;

    // 2. Fast-fail before running validation
    if (maxResponses != null && form.responseCount >= maxResponses) {
        return res.status(403).json({
            status: 'fail',
            message: 'Sorry, the form has reached its response limit.'
        });
    }

    // 3. Validate answers against active form rules
    const validation = validateSubmission(form, answers);

    if (!validation?.isValid) {
        return res.status(400).json({
            status: 'fail',
            message: validation.message,
            questionId: validation.questionId
        });
    }

    // 4. Atomically claim a response slot (prevents race conditions) using Transactions
    let createdResponse;
    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async function () {
            const claimed = await Form.claimResponseSlot(form._id, session);
            console.log('form');

            if (!claimed) {
                throw new AppError(
                    'The form is closed or has reached its response limit',
                    409
                );
            }

            const [doc] = await Response.create(
                [
                    {
                        formId: form._id,
                        respondentId: req.user?.id,
                        answers: validation.sanitizedAnswers ?? answers
                    }
                ],
                { session }
            );

            createdResponse = doc;
        });
    } finally {
        await session.endSession();
    }

    return res.status(201).json({
        status: 'success',
        data: { response: createdResponse }
    });
};
