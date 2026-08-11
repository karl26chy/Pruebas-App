import React from 'react';
import { Reply, Send } from 'lucide-react';
import { Card, CardTitle, Field, INPUT, PRIMARY_BUTTON, SECONDARY_BUTTON } from '../ui';
import type { Message } from '../../types';

export interface Recipient {
  id: string;
  label: string;
}

interface MessageComposerProps {
  title: string;
  recipients: Recipient[];
  replyTo: Message | null;
  /** Nombre visible del remitente al que se responde. */
  nameOf: (userId: string) => string;
  /** El portal del estudiante muestra además un extracto del mensaje citado. */
  showQuotedBody?: boolean;
  recipientId: string;
  onRecipientChange: (id: string) => void;
  subject: string;
  onSubjectChange: (subject: string) => void;
  body: string;
  onBodyChange: (body: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancelReply: () => void;
  subjectPlaceholder?: string;
  bodyPlaceholder?: string;
  bodyLabel?: string;
  submitLabel?: string;
}

/** Formulario de envío y respuesta de mensajes. */
export const MessageComposer: React.FC<MessageComposerProps> = ({
  title,
  recipients,
  replyTo,
  nameOf,
  showQuotedBody = false,
  recipientId,
  onRecipientChange,
  subject,
  onSubjectChange,
  body,
  onBodyChange,
  onSubmit,
  onCancelReply,
  subjectPlaceholder,
  bodyPlaceholder,
  bodyLabel = 'Mensaje',
  submitLabel = 'Enviar',
}) => (
  <Card className="h-fit">
    <CardTitle
      icon={
        replyTo ? (
          <Reply className="h-4 w-4 text-q10-600" />
        ) : (
          <Send className="h-4 w-4 text-q10-600" />
        )
      }
      className="mb-6"
    >
      {replyTo ? 'Responder Mensaje' : title}
    </CardTitle>

    {replyTo && (
      <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500">
        <span className="font-semibold text-gray-700">Respondiendo a:</span>
        <div className="mt-1">{nameOf(replyTo.remitente_id)}</div>
        <div className="font-medium text-gray-700">{replyTo.asunto}</div>
        {showQuotedBody && <p className="text-gray-400 mt-1 line-clamp-2">{replyTo.cuerpo}</p>}
      </div>
    )}

    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Destinatario">
        <select
          required
          value={recipientId}
          onChange={e => onRecipientChange(e.target.value)}
          className={INPUT}
        >
          <option value="">-- Seleccionar --</option>
          {recipients.map(r => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Asunto">
        <input
          type="text"
          required
          value={subject}
          onChange={e => onSubjectChange(e.target.value)}
          placeholder={subjectPlaceholder}
          className={INPUT}
        />
      </Field>

      <Field label={bodyLabel}>
        <textarea
          required
          rows={4}
          value={body}
          onChange={e => onBodyChange(e.target.value)}
          placeholder={bodyPlaceholder}
          className={INPUT}
        />
      </Field>

      <div className="flex gap-2">
        <button type="submit" className={`flex-1 ${PRIMARY_BUTTON}`}>
          {replyTo ? 'Responder' : submitLabel}
        </button>
        {replyTo && (
          <button type="button" onClick={onCancelReply} className={SECONDARY_BUTTON}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  </Card>
);
