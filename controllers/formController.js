const Form = require('../models/formModel');

exports.createForm = async (req, res) => {
    const { title, description, questions, status, settings, slug } = req.body;
    const creatorId = req.user;
    console.log(creatorId);

    const form = await Form.create({
        title,
        description,
        questions,
        creatorId,
        status,
        settings,
        slug
    });

    res.status(201).json({
        status: 'success',
        data: form
    });
};

// const addQuestionSet = async (req, res) => {};
