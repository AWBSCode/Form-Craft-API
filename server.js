const mongoose = require('mongoose');

const app = require('./app');

const PORT = process.env.PORT || 3000;

const connectDB = async () => {
    try {
        const connection = await mongoose.connect(
            process.env.CONNECTION_STRING
        );

        if (connection.connection.readyState === 1) {
            console.log('Connected to MongoDB');
        }
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

connectDB();

app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});
