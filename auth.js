const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const router = express.Router();

module.exports = (bcrypt) => {
    const customerSchema = new mongoose.Schema({
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        fullname: String,
        user_type: String,
        id_number: String,
        nationality: String,
        gender: String,
        emergency_name: String,
        emergency_contact: String
    });

    const authoritySchema = new mongoose.Schema({
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        authority_name: String,
        organization: String,
        authority_id: String
    });

    customerSchema.pre('save', async function(next) {
        if (this.isModified('password')) {
            this.password = await bcrypt.hash(this.password, 10);
        }
        next();
    });

    authoritySchema.pre('save', async function(next) {
        if (this.isModified('password')) {
            this.password = await bcrypt.hash(this.password, 10);
        }
        next();
    });

    const Customer = mongoose.model('Customer', customerSchema);
    const Authority = mongoose.model('Authority', authoritySchema);

    router.post('/signup/customer', async (req, res) => {
        try {
            const newCustomer = new Customer(req.body);
            await newCustomer.save();
            res.status(201).send('Customer registered successfully');
        } catch (err) {
            if (err.code === 11000) {
                return res.status(409).send('User with this email already exists');
            }
            res.status(500).send('Server error');
        }
    });

    router.post('/signup/authority', async (req, res) => {
        try {
            const newAuthority = new Authority(req.body);
            await newAuthority.save();
            res.status(201).send('Authority registered successfully');
        } catch (err) {
            if (err.code === 11000) {
                return res.status(409).send('Authority with this email already exists');
            }
            res.status(500).send('Server error');
        }
    });

    router.post('/login/customer', async (req, res) => {
        const { email, password } = req.body;
        try {
            const customer = await Customer.findOne({ email });
            if (!customer) {
                return res.status(401).send('Invalid email or password');
            }
            const isMatch = await bcrypt.compare(password, customer.password);
            if (isMatch) {
                res.status(200).send('Login successful');
            } else {
                res.status(401).send('Invalid email or password');
            }
        } catch (error) {
            res.status(500).send('Server error');
        }
    });

    router.post('/login/authority', async (req, res) => {
        const { email, password } = req.body;
        try {
            const authority = await Authority.findOne({ email });
            if (!authority) {
                return res.status(401).send('Invalid email or password');
            }
            const isMatch = await bcrypt.compare(password, authority.password);
            if (isMatch) {
                res.status(200).send('Login successful');
            } else {
                res.status(401).send('Invalid email or password');
            }
        } catch (error) {
            res.status(500).send('Server error');
        }
    });

    // Fetch profile info by email
    router.get('/profile', async (req, res) => {
        const { email } = req.query;
        if (!email) return res.status(400).send('Email required');
        try {
            const customer = await Customer.findOne({ email });
            if (customer) {
                return res.json({ fullname: customer.fullname, nationality: customer.nationality });
            }
            const authority = await Authority.findOne({ email });
            if (authority) {
                return res.json({ fullname: authority.authority_name, nationality: null });
            }
            res.status(404).send('User not found');
        } catch (error) {
            res.status(500).send('Server error');
        }
    });
    return router;
};