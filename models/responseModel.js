const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema(
    {
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
        value: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        }
    },
    { _id: false }
);

const ResponseSchema = new mongoose.Schema({
    formId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Form',
        required: true
    },
    respondentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    answers: {
        type: Map,
        of: AnswerSchema,
        required: true
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

const Response = mongoose.model('Response', ResponseSchema);

module.exports = Response;
