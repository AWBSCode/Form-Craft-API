const express = require('express');
const { protect } = require('../controllers/authController');
const {
    createForm,
    editQuestionSet,
    formOwnerOnly,
    editForm,
    getFormForCreator,
    getAllFormForCreator,
    getPublicForm
} = require('../controllers/formController');

const router = express.Router();

router.post('/new', protect, createForm);
router.put('/:formId', protect, formOwnerOnly, editQuestionSet);
router.patch('/:formId', protect, formOwnerOnly, editForm);

router.get('/:formId', protect, formOwnerOnly, getFormForCreator);
router.get('/', protect, getAllFormForCreator);

router.get('/public/:slug', protect, getPublicForm);

module.exports = router;
