const { v3: uuid } = require('uuid');
const slugify = require('slugify');

module.exports = (req, res, next) => {
    if (!req.body.questions || req.body.questions.length == 0) next();

    const { questions } = req.body;

    questions.forEach((question) => {
        question.questionId = `q_${uuid()}`;
        const { options } = question.config;
        if (options && options.length > 0) {
            options.forEach((option) => {
                option.optionId = `opt_${uuid()}`;
            });
        }
    });

    req.body.questions = questions;

    if (req.body.title) req.body.slug = slugify(req.body.title);

    console.log(req.body);
    next();
};
