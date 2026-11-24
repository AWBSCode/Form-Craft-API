const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');

const validatePassword = function (password) {
    return validator.matches(
        password,
        /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
    );
};

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: validator.isEmail,
            message: 'Please fill a valid email address'
        }
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        select: false
    }
});

UserSchema.virtual('confirmPassword')
    .get(function () {
        return this._confirmPassword;
    })
    .set(function (value) {
        this._confirmPassword = value;
    });

// 2. Validation Hook (runs automatically before .save())
UserSchema.pre('validate', function () {
    if (this.isModified('password') && this.password !== this.confirmPassword) {
        this.invalidate('confirmPassword', 'Passwords must match');
    } else if (
        this.isModified('password') &&
        !validatePassword(this.password)
    ) {
        this.invalidate(
            'password',
            'Password must be at least 8 characters long and contain both letters and numbers'
        );
    }
});

// 3. Hash the password before saving (async without next)
UserSchema.pre('save', async function () {
    // Only hash if the password was created or changed
    if (!this.isModified('password')) return;

    this.password = await bcrypt.hash(this.password, 10);
    this._confirmPassword = undefined; // Remove confirmPassword field
});

UserSchema.methods.correctPassword = async function (
    userPassword,
    hashedPassword
) {
    return await bcrypt.compare(userPassword, hashedPassword);
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
