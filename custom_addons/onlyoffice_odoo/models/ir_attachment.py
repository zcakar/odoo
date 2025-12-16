from odoo import _, models


class IrAttachment(models.Model):
    _inherit = "ir.attachment"

    def _log_attachment_event(self, message):
        """Post a chatter note on the related record if it supports it."""
        for attachment in self:
            if not (attachment.res_model and attachment.res_id):
                continue
            record = self.env[attachment.res_model].browse(attachment.res_id)
            if not (record and record.exists() and hasattr(record, "message_post")):
                continue
            try:
                record.message_post(body=message, subtype_xmlid="mail.mt_note")
            except Exception:
                # Never block attachment operations because of chatter errors.
                continue

    def create(self, vals):
        vals_list = vals if isinstance(vals, list) else [vals]
        records = super().create(vals_list if len(vals_list) > 1 else vals_list[0])
        for attachment in records:
            message = _("Attachment added: %s") % attachment.name
            attachment._log_attachment_event(message)
        return records

    def write(self, vals):
        tracked_fields = {"datas", "raw", "store_fname", "checksum", "url", "db_datas", "name", "mimetype"}
        should_log = bool(set(vals).intersection(tracked_fields))
        res = super().write(vals)
        if should_log:
            for attachment in self:
                message = _("Attachment updated: %s") % attachment.name
                attachment._log_attachment_event(message)
        return res

    def unlink(self):
        # Capture names before deletion for the log message.
        to_log = [
            {
                "res_model": attachment.res_model,
                "res_id": attachment.res_id,
                "name": attachment.name,
            }
            for attachment in self
        ]
        res = super().unlink()
        for data in to_log:
            record = None
            if data["res_model"] and data["res_id"]:
                record = self.env[data["res_model"]].browse(data["res_id"])
            if record and record.exists() and hasattr(record, "message_post"):
                try:
                    message = _("Attachment removed: %s") % data["name"]
                    record.message_post(body=message, subtype_xmlid="mail.mt_note")
                except Exception:
                    continue
        return res
