const Form = require('../models/formModel');

/**
 *
 * @param {string} userId
 * @param {stirng} formId
 * @returns bool
 */
module.exports = async (userId, formId) => {
    const form = await Form.findById(formId);
    console.log(userId, form.creatorId.toString());

    return form && form.creatorId == userId;
};
