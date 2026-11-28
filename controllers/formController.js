const Form = require('../models/formModel');
const isOwnForm = require('../utils/isOwnForm');
const AppError = require('../utils/AppError');

// middleware to allow access to the creator only [based on the `protect` middleware]
exports.formOwnerOnly = async (req, res, next) => {
    const isOwn = await isOwnForm(req.user.id, req.params.formId);
    if (isOwn) next();
    else
        return res.status(404).json({
            status: 'fail',
            message: 'form is not found in your profile'
        });
};

// POST
exports.createForm = async (req, res) => {
    const { title, description, questions, status, settings } = req.body;
    const creatorId = req.user.id;

    const form = await Form.create({
        title,
        description,
        questions,
        creatorId,
        status,
        settings
    });

    res.status(201).json({
        status: 'success',
        data: form
    });
};

// PATCH: edit question set
exports.editQuestionSet = async (req, res) => {
    const { questions } = req.body;
    const { formId } = req.params;

    if (!questions || questions.length < 0) {
        return res.status(401).json({
            status: 'fail',
            message: 'question set is empty'
        });
    }

    const form = await Form.findById(formId);

    form.handleNewQuestions(questions);

    const updated = await form.save();

    return res.status(201).json({
        status: 'success',
        data: updated
    });
};

// PUT: edit form meta data
exports.editForm = async (req, res) => {
    const { title, settings, status } = req.body;
    const { formId } = req.params;

    const updatedForm = await Form.findOneAndUpdate(
        { _id: formId },
        {
            title,
            settings,
            status
        },
        { new: true, runValidators: true }
    );

    if (!updatedForm) {
        throw new AppError('error in updating the form, maybe the id is wrong');
    }

    res.status(200).json({
        status: 'success',
        data: updatedForm
    });
};

// GET
/// get all form data to the creator
exports.getFormForCreator = async (req, res) => {
    const { formId } = req.params;
    const form = await Form.findById(formId)
        .select('-creatorId -updatedAt -createdAt')
        .lean();

    if (!form) {
        throw new AppError('form is not found');
    }

    res.status(200).json({
        status: 'success',
        data: form
    });
};

/// get all forms to the same creator
exports.getAllFormForCreator = async (req, res) => {
    const userId = req.user.id;

    const forms = await Form.find({ creatorId: userId }).lean();

    res.status(200).json({
        status: 'success',
        data: forms
    });
};

/// get the form publicly by the slug (not yet implemented)
exports.getPublicForm = async (req, res) => {
    const { slug } = req.params;
    const form = await Form.findOne({
        slug,
        status: { $in: ['published', 'closed'] }
    }).select('-_id');

    if (!form)
        return res.status(404).json({
            status: 'fail',
            message: 'not found'
        });

    if (form.status == 'closed')
        return res.status(400).json({
            status: 'fail',
            message: 'Sorry this form is closed right now. it may open later.'
        });

    res.status(200).json({
        status: 'success',
        data: form
    });
};

// DELETE
/// cascade delete the from (implemented after database completion)
