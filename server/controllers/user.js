import User from '../models/user.js'
import Lead from '../models/lead.js'
import { createError, isValidDate } from '../utils/error.js'
import { getStringValue, getPhoneValue, validateUserFields } from '../middleware/validation.js'
import bcrypt from 'bcryptjs'


export const getUsers = async (req, res, next) => {
    try {

        const users = await User.find()
        res.status(200).json({ result: users, message: 'users fetched seccessfully', success: true })

    } catch (err) {
        next(createError(500, err.message))

    }
}

export const getUser = async (req, res, next) => {
    try {

        const { userId } = req.params
        const findedUser = await User.findById(userId)
        if (!findedUser) return next(createError(401, 'User not exist'))

        res.status(200).json({ result: findedUser, message: 'user fetched seccessfully', success: true })

    } catch (err) {
        next(createError(500, err.message))

    }
}

export const filterUser = async (req, res, next) => {
    const { startingDate, endingDate, ...filters } = req.query;
    try {
        let query = await User.find(filters)

        // Check if startingDate is provided and valid
        if (startingDate && isValidDate(startingDate)) {
            const startDate = new Date(startingDate);
            startDate.setHours(0, 0, 0, 0);

            // Add createdAt filtering for startingDate
            query = query.where('createdAt').gte(startDate);
        }

        // Check if endingDate is provided and valid
        if (endingDate && isValidDate(endingDate)) {
            const endDate = new Date(endingDate);
            endDate.setHours(23, 59, 59, 999);

            // Add createdAt filtering for endingDate
            if (query.model.modelName === 'User') { // Check if the query has not been executed yet
                query = query.where('createdAt').lte(endDate);
            }
        }
        if (query.length > 0) {
            query = await query.populate('userId').exec();
        }
        res.status(200).json({ result: query });

    } catch (error) {
        next(createError(500, error.message));
    }
};


export const getClients = async (req, res, next) => {
    try {

        const findedClients = await User.find({ role: 'client' })
        res.status(200).json({ result: findedClients, message: 'clients fetched seccessfully', success: true })

    } catch (err) {
        next(createError(500, err.message))

    }
}

export const getEmployeeClients = async (req, res, next) => {
    try {
        let allClients = await User.find({ role: 'client' })
        const employeeLeads = await Lead.find({ allocatedTo: { $in: req.user?._id }, isArchived: false })

        // Filter clients based on the condition
        allClients = allClients.filter((client) => {
            return employeeLeads.findIndex(lead => lead.clientPhone.toString() === client.phone.toString()) !== -1
        });

        res.status(200).json({ result: allClients, message: 'clients fetched successfully', success: true });
    } catch (err) {
        next(createError(500, err.message));
    }
};

export const getEmployees = async (req, res, next) => {
    try {

        const findedEmployees = await User.find({ role: 'employee' })
        res.status(200).json({ result: findedEmployees, message: 'employees fetched seccessfully', success: true })

    } catch (err) {
        next(createError(500, err.message))
    }
}

export const createClient = async (req, res, next) => {
    try {

        const { firstName, lastName, username, password, phone, email, city, CNIC } = req.body || {}
        const clientData = {
            firstName: getStringValue(firstName),
            lastName: getStringValue(lastName),
            username: getStringValue(username),
            password: getStringValue(password),
            phone: getPhoneValue(phone),
            email: getStringValue(email).toLowerCase(),
            city: getStringValue(city),
            CNIC: getStringValue(CNIC),
        }

        const validationError = validateUserFields(clientData, ['username', 'password', 'phone'])
        if (validationError) return next(createError(400, validationError))

        const findedUserByUsername = await User.findOne({ username: clientData.username })
        if (Boolean(findedUserByUsername)) return next(createError(400, 'Username already exist'))

        if (clientData.email) {
            const findedUser = await User.findOne({ email: clientData.email })
            if (Boolean(findedUser)) return next(createError(400, 'Email already exist'))
        }

        const hashedPassword = await bcrypt.hash(clientData.password, 12)

        const result = await User.create({ ...clientData, password: hashedPassword, role: 'client' })
        res.status(200).json({ result, message: 'client created seccessfully', success: true })

    } catch (err) {
        next(createError(500, err.message))
    }
}
export const createEmployee = async (req, res, next) => {
    try {

        const { firstName, lastName, username, password, phone, email, city, CNIC } = req.body || {}
        const employeeData = {
            firstName: getStringValue(firstName),
            lastName: getStringValue(lastName),
            username: getStringValue(username),
            password: getStringValue(password),
            phone: getPhoneValue(phone),
            email: getStringValue(email).toLowerCase(),
            city: getStringValue(city),
            CNIC: getStringValue(CNIC),
        }

        const validationError = validateUserFields(employeeData, ['username', 'password', 'phone'])
        if (validationError) return next(createError(400, validationError))

        const findedUser = await User.findOne({ username: employeeData.username })
        if (Boolean(findedUser)) return next(createError(400, 'Username already exist'))

        if (employeeData.email) {
            const findedUserByEmail = await User.findOne({ email: employeeData.email })
            if (Boolean(findedUserByEmail)) return next(createError(400, 'Email already exist'))
        }

        const hashedPassword = await bcrypt.hash(employeeData.password, 12)

        const result = await User.create({ ...employeeData, password: hashedPassword, role: 'employee' })
        res.status(200).json({ result, message: 'employee created seccessfully', success: true })

    } catch (err) {
        next(createError(500, err.message))
    }
}

export const updateRole = async (req, res, next) => {
    try {

        const { userId } = req.params
        const { role } = req.body

        const findedUser = await User.findById(userId)
        if (!findedUser) return next(createError(401, 'User not exist'))

        const updatedUser = await User.findByIdAndUpdate(userId, { role }, { new: true })
        res.status(200).json({ reuslt: updatedUser, message: 'Role updated successfully', success: true })

    } catch (err) {
        next(createError(500, err.message))
    }
}

export const updateUser = async (req, res, next) => {
    try {
        const { userId } = req.params
        const body = req.body || {}

        const updateData = {}

        if (body.firstName != undefined) updateData.firstName = getStringValue(body.firstName)
        if (body.lastName != undefined) updateData.lastName = getStringValue(body.lastName)
        if (body.username != undefined) updateData.username = getStringValue(body.username)
        if (body.phone != undefined) updateData.phone = getPhoneValue(body.phone)
        if (body.email != undefined) updateData.email = getStringValue(body.email).toLowerCase()
        if (body.city != undefined) updateData.city = getStringValue(body.city)
        if (body.CNIC != undefined) updateData.CNIC = getStringValue(body.CNIC)
        if (body.password != undefined) updateData.password = getStringValue(body.password)

        if (!Object.keys(updateData).length) return next(createError(400, 'No valid fields provided for update'))
        
        const validationError = validateUserFields(updateData, [])
        if (validationError) return next(createError(400, validationError))

        const findedUser = await User.findById(userId)
        if (!findedUser) return next(createError(401, 'User not exist'))

        if (updateData.username) {
            const findedUserByUsername = await User.findOne({ username: updateData.username, _id: { $ne: userId } })
            if (Boolean(findedUserByUsername)) return next(createError(400, 'Username already exist'))
        }

        if (updateData.email) {
            const findedUserByEmail = await User.findOne({ email: updateData.email, _id: { $ne: userId } })
            if (Boolean(findedUserByEmail)) return next(createError(400, 'Email already exist'))
        }

        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 12)
        }

        const updatedUser = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true, runValidators: true })
        res.status(200).json({ result: updatedUser, message: 'User info updated successfully', success: true })

    } catch (err) {
        next(createError(500, err.message))
    }
}

export const deleteUser = async (req, res, next) => {
    try {
        const { userId } = req.params
        const findedUser = await User.findById(userId)
        if (!findedUser) return next(createError(400, 'User not exist'))

        const deletedUser = await User.findByIdAndDelete(userId)
        res.status(200).json({ result: deletedUser, message: 'User deleted successfully', success: true })

    } catch (err) {
        next(createError(500, err.message))
    }
}

export const deleteWholeCollection = async (req, res, next) => {
    try {

        const result = await User.deleteMany()
        res.status(200).json({ result, message: 'User collection deleted successfully', success: true })

    } catch (err) {
        next(createError(500, err.message))
    }
}
