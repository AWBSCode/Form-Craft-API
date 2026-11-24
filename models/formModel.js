const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema(
    {
        optionId: { type: String, required: true },
        label: { type: String, required: true, trim: true },
        archived: { type: Boolean, default: false }
    },
    { _id: false }
);

const QuestionSchema = new mongoose.Schema(
    {
        questionId: {
            type: String,
            required: [true, 'Question ID is required']
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
        // order: { type: Number, default: 0 },
        archived: { type: Boolean, default: false },
        config: {
            options: [OptionSchema],
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
        questions: [QuestionSchema],
        slug: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
            lowercase: true
        }
    },
    { timestamps: true }
);

// FormSchema.pre('save', function () {
//     if (!this.slug) {
//         this.slug =
//     }
// })

const Form = mongoose.model('Form', FormSchema);

module.exports = Form;
