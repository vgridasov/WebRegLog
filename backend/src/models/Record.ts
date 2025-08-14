import mongoose, { Document, Schema } from 'mongoose';

export interface IRecordData {
  [fieldId: string]: any; // Динамические поля в зависимости от структуры журнала
}

export interface IRecord extends Document {
  _id: mongoose.Types.ObjectId;
  journalId: mongoose.Types.ObjectId;
  data: IRecordData;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const recordSchema = new Schema<IRecord>({
  journalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Journal',
    required: true
  },
  data: {
    type: Schema.Types.Mixed,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Индексы для улучшения производительности
recordSchema.index({ journalId: 1 });
recordSchema.index({ createdBy: 1 });
recordSchema.index({ createdAt: -1 });

// Составной индекс для поиска по журналу и дате
recordSchema.index({ journalId: 1, createdAt: -1 });

export const Record = mongoose.model<IRecord>('Record', recordSchema);
