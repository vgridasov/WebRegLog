import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        message: 'Ошибка валидации данных',
        errors: errorDetails
      });
    }
    
    next();
  };
};

// Схемы валидации
export const authSchemas = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Неверный формат email',
      'any.required': 'Email обязателен'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Пароль должен содержать минимум 6 символов',
      'any.required': 'Пароль обязателен'
    }),
    firstName: Joi.string().required().messages({
      'any.required': 'Имя обязательно'
    }),
    lastName: Joi.string().required().messages({
      'any.required': 'Фамилия обязательна'
    }),
    role: Joi.string().valid('admin', 'registrar', 'analyst').optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Неверный формат email',
      'any.required': 'Email обязателен'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Пароль обязателен'
    })
  })
};

export const journalSchemas = {
  create: Joi.object({
    name: Joi.string().required().messages({
      'any.required': 'Название журнала обязательно'
    }),
    description: Joi.string().optional(),
    uniqueId: Joi.string().required().messages({
      'any.required': 'Уникальный идентификатор обязателен'
    }),
    fields: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        type: Joi.string().valid('text', 'number', 'date', 'select', 'checkbox', 'radio', 'file').required(),
        label: Joi.string().required(),
        placeholder: Joi.string().optional(),
        required: Joi.boolean().default(false),
        options: Joi.array().items(Joi.string()).when('type', {
          is: Joi.string().valid('select', 'radio'),
          then: Joi.required(),
          otherwise: Joi.optional()
        }),
        validation: Joi.object({
          min: Joi.number().optional(),
          max: Joi.number().optional(),
          pattern: Joi.string().optional()
        }).optional(),
        order: Joi.number().required()
      })
    ).required(),
    access: Joi.array().items(
      Joi.object({
        userId: Joi.string().required(),
        role: Joi.string().valid('registrar', 'analyst').required()
      })
    ).optional()
  }),

  update: Joi.object({
    name: Joi.string().optional(),
    description: Joi.string().optional(),
    fields: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        type: Joi.string().valid('text', 'number', 'date', 'select', 'checkbox', 'radio', 'file').required(),
        label: Joi.string().required(),
        placeholder: Joi.string().optional(),
        required: Joi.boolean().default(false),
        options: Joi.array().items(Joi.string()).when('type', {
          is: Joi.string().valid('select', 'radio'),
          then: Joi.required(),
          otherwise: Joi.optional()
        }),
        validation: Joi.object({
          min: Joi.number().optional(),
          max: Joi.number().optional(),
          pattern: Joi.string().optional()
        }).optional(),
        order: Joi.number().required()
      })
    ).optional(),
    access: Joi.array().items(
      Joi.object({
        userId: Joi.string().required(),
        role: Joi.string().valid('registrar', 'analyst').required()
      })
    ).optional()
  })
};

export const recordSchemas = {
  create: Joi.object({
    journalId: Joi.string().required().messages({
      'any.required': 'ID журнала обязателен'
    }),
    data: Joi.object().required().messages({
      'any.required': 'Данные записи обязательны'
    })
  }),

  update: Joi.object({
    data: Joi.object().required().messages({
      'any.required': 'Данные записи обязательны'
    })
  })
};
