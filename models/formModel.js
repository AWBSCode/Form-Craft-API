const mongoose = require('mongoose');
const crypto = require('crypto');
const generateFormSlug = require('../utils/generateSlug');
const {
    hasBreakingChange,
    pickQuestion,
    questionsArrayValidator
} = require('../utils/questionPolicy');
const AppError = require('../utils/AppError');

const OptionSchema = new mongoose.Schema(
    {
        optionId: {
            type: String,
            default: () => `opt_${crypto.randomUUID()}`,
            immutable: true
        },
        label: { type: String, required: true, trim: true }
    },
    { _id: false }
);

const QuestionSchema = new mongoose.Schema(
    {
        questionId: {
            type: String,
            default: () => `q_${crypto.randomUUID()}`,
            immutable: true
        },
        type: {
            type: String,
            required: true,
            enum: [
                'short_text',
                'long_text',
                'single_choice',
                'multi_choice',
                'rating',
                'number',
                'boolean'
            ]
        },
        label: { type: String, required: true, trim: true },
        required: { type: Boolean, default: false },
        order: { type: Number },
        archived: { type: Boolean, default: false },
        archivedAt: { type: Date },
        config: {
            options: { type: [OptionSchema], default: undefined },
            min: Number,
            max: Number,
            maxLength: Number
        },
        rootQuestionId: {
            type: String,
            immutable: true
        }
    },
    { _id: false }
);

const FormSchema = new mongoose.Schema(
    {
        creatorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        title: {
            type: String,
            required: [true, 'Form title is required'],
            trim: true,
            maxlength: 200
        },
        description: { type: String, trim: true },
        status: {
            type: String,
            enum: ['draft', 'published', 'closed'],
            default: 'draft'
        },
        responseCount: {
            type: Number,
            default: 0,
            min: 0,
            validate: {
                validator(val) {
                    const max = this.settings?.maxResponses;
                    return max == null || val <= max;
                },
                message: 'responseCount cannot exceed settings.maxResponses'
            }
        },
        settings: {
            expiresAt: Date,
            maxResponses: { type: Number, min: 1 },
            limitOnePerUser: { type: Boolean, default: false }
        },
        questions: {
            type: [QuestionSchema],
            default: [],
            validate: questionsArrayValidator
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            immutable: true,
            trim: true,
            lowercase: true
        }
    },
    {
        timestamps: true,
        optimisticConcurrency: true
    }
);

FormSchema.pre('validate', function () {
    if (!this.slug) {
        this.slug = generateFormSlug(this.title);
    }
});

FormSchema.methods.handleNewQuestions = function (incoming) {
    if (!Array.isArray(incoming) || incoming.length === 0)
        throw new AppError('questions must be a non-empty array', 400);

    const ids = incoming.map((q) => q.questionId).filter(Boolean); // filling the incoming ids

    if (new Set(ids).size !== ids.length)
        throw new AppError('duplicate questionId', 400);

    // zero responses: hard replace, but preserve IDs only for questions that already exist
    if (this.responseCount === 0) {
        const known = new Set(this.questions.map((q) => q.questionId));
        this.questions = incoming.map((q, i) => ({
            ...pickQuestion(q, i),
            ...(known.has(q.questionId) ? { questionId: q.questionId } : {})
        }));
        return;
    }

    const active = new Map(
        this.questions.filter((q) => !q.archived).map((q) => [q.questionId, q])
    );

    for (const id of ids)
        if (!active.has(id))
            throw new AppError(`unknown or archived question: ${id}`, 400);

    const now = new Date();
    const incomingIds = new Set(ids);
    const next = this.questions.filter((q) => q.archived); // keep history

    // soft delete for the not existing elements
    for (const q of active.values()) {
        if (!incomingIds.has(q.questionId)) {
            q.archived = true;
            q.archivedAt = now;
            next.push(q);
        }
    }

    incoming.forEach((q, i) => {
        const old = q.questionId && active.get(q.questionId);
        if (!old) return next.push(pickQuestion(q, i)); // new question
        if (!hasBreakingChange(old, q)) {
            old.set({ ...pickQuestion(q, i), questionId: old.questionId }); // trusted fields only
            return next.push(old);
        }
        old.archived = true;
        old.archivedAt = now;
        next.push(old, {
            ...pickQuestion(q, i),
            rootQuestionId: old.rootQuestionId ?? old.questionId
        });
    });

    this.questions = next;
};

FormSchema.statics.claimResponseSlot = async function (formId, session = null) {
    const result = await this.updateOne(
        {
            _id: formId,
            status: 'published',
            $or: [
                { 'settings.maxResponses': null },
                {
                    $expr: {
                        $lt: [
                            { $ifNull: ['$responseCount', 0] },
                            '$settings.maxResponses'
                        ]
                    }
                }
            ]
        },
        { $inc: { responseCount: 1 } },
        { session }
    );

    return result.modifiedCount === 1;
};

const Form = mongoose.model('Form', FormSchema);

module.exports = Form;
