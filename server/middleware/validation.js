import validator from 'validator'

export const getStringValue = (value) => {
    if (typeof value === 'string') return value.trim()
    return ''
}

export const getPhoneValue = (value) => {
    if (typeof value === 'string') return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return value.toString()
    return ''
}

export const validateRequiredFields = (data, fields) => {
    const missingFields = fields.filter((field) => !getStringValue(data[field]))
    if (missingFields.length) return `Make sure to provide all the fields: ${missingFields.join(', ')}`

    return null
}

export const validateUserFields = ({ firstName, lastName, username, phone, email, password, city, CNIC }, requiredFields) => {
    const missingFieldsError = validateRequiredFields({ firstName, lastName, username, phone, email, password }, requiredFields)
    if (missingFieldsError) return missingFieldsError

    if (firstName && !validator.isLength(firstName, { min: 2, max: 50 })) return 'First name must be between 2 and 50 characters'
    if (lastName && !validator.isLength(lastName, { min: 2, max: 50 })) return 'Last name must be between 2 and 50 characters'
    if (username && !validator.isLength(username, { min: 3, max: 50 })) return 'Username must be between 3 and 50 characters'
    if (phone && !validator.isMobilePhone(phone, "any")) return 'Please provide a valid phone number'
    if (email && !validator.isEmail(email)) return 'Invalid Email Address'
    if (password && !validator.isLength(password, { min: 6, max: 128 })) return 'Password must be between 6 and 128 characters'
    if (city && !validator.isLength(city, { min: 2, max: 100 })) return 'City must be between 2 and 100 characters'
    if (CNIC && !validator.isLength(CNIC, { min: 5, max: 30 })) return 'CNIC must be between 5 and 30 characters'

    return null
}