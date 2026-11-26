const mongoose = require('mongoose');
const crypto = require('crypto');
const generateFormSlug = require('../utils/generateSlug');
const { hasQuestionChanged } = require('../utils/questionSoftDeleteHelpers');

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
        archived: { type: Boolean },
        archivedAt: { type: Date },
        config: {
            options: { type: [OptionSchema], default: undefined },
            min: Number,
            max: Number,
            maxLength: Number
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
        responseCount: { type: Number, default: 0, min: 0 },
        settings: {
            expiresAt: Date,
            maxResponses: { type: Number, min: 1 },
            limitOnePerUser: { type: Boolean, default: false }
        },
        questions: { type: [QuestionSchema], default: [] },
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

function buildConfig(config, validOptIds = null) {
    if (!config) return undefined;

    const nextConfig = {};
    if (config.min !== undefined) nextConfig.min = config.min;
    if (config.max !== undefined) nextConfig.max = config.max;
    if (config.maxLength !== undefined) nextConfig.maxLength = config.maxLength;

    if (Array.isArray(config.options)) {
        nextConfig.options = config.options.map((opt) => ({
            ...(validOptIds && opt.optionId && validOptIds.has(opt.optionId)
                ? { optionId: opt.optionId }
                : {}),
            label: opt.label
        }));
    }

    return nextConfig;
}

FormSchema.methods.handleNewQuestions = function (incomingQuestions = []) {
    // 1. Draft / zero responses: hard-replace safely while blocking ID/archived spoofing
    if (this.responseCount === 0) {
        this.questions = incomingQuestions;
        return this.questions;
    }

    // 2. pre-answered form

    const now = new Date();

    const oldActiveMap = new Map();
    const incomingIDsSet = new Set();
    const rebuiltQuestions = [];

    // pass 1: filling the incomingIDsSet
    for (const q of incomingQuestions) {
        if (q.questionId) {
            incomingIDsSet.add(q.questionId);
        }
    }

    // pass 2: handle already archived and deleted questions + fill the oldActiveMap
    for (const q of this.questions) {
        // already archived before
        if (q.archived) {
            rebuiltQuestions.push(q);
            continue;
        }

        // deleted
        if (!incomingIDsSet.has(q.questionId)) {
            q.archived = true;
            q.archivedAt = now;
            rebuiltQuestions.push(q);
            continue;
        }

        oldActiveMap.set(q.questionId, q);
    }

    // pass 3: handle editted, new and unchanged questions
    for (const q of incomingQuestions) {
        // handle new questions: new questions doesn't have an id
        if (!q.questionId) {
            rebuiltQuestions.push(q);
        } else {
            // edit vs unchanged
            const oldQuestion = oldActiveMap.get(q.questionId);

            console.log(
                'OLD:',
                JSON.stringify(oldQuestion.toObject(), null, 2)
            );
            console.log('NEW:', JSON.stringify(q, null, 2));

            if (!hasQuestionChanged(oldQuestion, q)) {
                rebuiltQuestions.push(q);
            } else {
                oldQuestion.archived = true;
                oldQuestion.archivedAt = now;
                q.questionId = undefined; // doesn't an id to generate a new one from the schema
                rebuiltQuestions.push(oldQuestion, q);
            }
        }
    }

    this.questions = rebuiltQuestions;
};

const Form = mongoose.model('Form', FormSchema);

module.exports = Form;
