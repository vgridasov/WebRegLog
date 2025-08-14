import mongoose, { Document, Schema } from 'mongoose';

export interface IFieldDefinition {
  id: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'radio' | 'file';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // Для select и radio
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  order: number;
}

export interface IJournalAccess {
  userId: mongoose.Types.ObjectId;
  role: 'registrar' | 'analyst';
}

export interface IJournal extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  uniqueId: string;
  fields: IFieldDefinition[];
  access: IJournalAccess[];
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const fieldDefinitionSchema = new Schema<IFieldDefinition>({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'number', 'date', 'select', 'checkbox', 'radio', 'file'],
    required: true
  },
  label: {
    type: String,
    required: true
  },
  placeholder: {
    type: String
  },
  required: {
    type: Boolean,
    default: false
  },
  options: [{
    type: String
  }],
  validation: {
    min: Number,
    max: Number,
    pattern: String
  },
  order: {
    type: Number,
    required: true
  }
});

const journalAccessSchema = new Schema<IJournalAccess>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['registrar', 'analyst'],
    required: true
  }
});

const journalSchema = new Schema<IJournal>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  uniqueId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  fields: [fieldDefinitionSchema],
  access: [journalAccessSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Индексы для улучшения производительности
journalSchema.index({ uniqueId: 1 });
journalSchema.index({ createdBy: 1 });
journalSchema.index({ 'access.userId': 1 });

export const Journal = mongoose.model<IJournal>('Journal', journalSchema);
