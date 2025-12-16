import logging
import os
import re

from odoo import _, api, fields, models

_logger = logging.getLogger(__name__)


class IrAttachment(models.Model):
    _inherit = "ir.attachment"

    oo_attachment_version = fields.Integer(
        string="OnlyOffice Version",
        default=1,
        copy=False,
        help="Lightweight version counter used by OnlyOffice callbacks.",
    )
    oo_is_snapshot = fields.Boolean(
        string="OnlyOffice Snapshot",
        default=False,
        copy=False,
        help="True for historical OnlyOffice copies that should be hidden from the main attachment list.",
    )
    oo_origin_attachment_id = fields.Many2one(
        "ir.attachment",
        string="OnlyOffice Origin",
        copy=False,
        help="Points to the live attachment this snapshot was created from.",
    )

    def init(self):
        # Initialize existing records once; safe to re-run on module update.
        self.env.cr.execute(
            "UPDATE ir_attachment SET oo_attachment_version = 1 WHERE oo_attachment_version IS NULL"
        )

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

    @api.model
    def _strip_version_suffix(self, name):
        """Return base filename without ' (vN)' suffix before extension."""
        base, ext = os.path.splitext(name or "")
        match = re.match(r"^(.*)\s+\(v\d+\)$", base)
        return (match.group(1) if match else base, ext)

    def _versioned_name(self, version):
        """Build a user-friendly versioned filename for the given version."""
        self.ensure_one()
        base_name, ext = self._strip_version_suffix(self.name)
        return f"{base_name} (v{version}){ext}"

    def _snapshot_onlyoffice_version(self):
        """Create an attachment copy representing the current version."""
        for attachment in self:
            version = attachment.oo_attachment_version or 1
            try:
                attachment.copy(
                    {
                        "name": attachment._versioned_name(version),
                        "oo_attachment_version": version,
                        "oo_is_snapshot": True,
                        "oo_origin_attachment_id": attachment.id,
                    }
                )
            except Exception as exc:  # pragma: no cover - should never block saves
                _logger.warning(
                    "Failed to snapshot OnlyOffice version for attachment %s: %s", attachment.id, exc
                )

    def _prune_old_versions(self, limit=10):
        """Keep only the latest `limit` OnlyOffice versions for the same record/name."""
        for attachment in self:
            if not attachment.oo_attachment_version:
                continue
            min_keep = attachment.oo_attachment_version - limit + 1
            if min_keep <= 0:
                continue

            base_name, ext = self._strip_version_suffix(attachment.name)
            candidates = (
                self.sudo()
                .search(
                    [
                        ("res_model", "=", attachment.res_model),
                        ("res_id", "=", attachment.res_id),
                        ("id", "!=", attachment.id),
                        ("oo_attachment_version", "<", min_keep),
                    ]
                )
            )

            to_unlink = candidates.filtered(
                lambda att: self._strip_version_suffix(att.name)[0] == base_name
                and os.path.splitext(att.name or "")[1] == ext
            )
            if to_unlink:
                to_unlink.unlink()

    def _to_store_defaults(self, target):
        """Expose OnlyOffice version to the mail attachment store for UI use."""
        fields_to_store = super()._to_store_defaults(target)
        for field in ("oo_attachment_version", "res_model", "res_id", "oo_is_snapshot"):
            if field not in fields_to_store:
                fields_to_store.append(field)
        return fields_to_store

    def create(self, vals):
        vals_list = vals if isinstance(vals, list) else [vals]
        for payload in vals_list:
            payload.setdefault("oo_attachment_version", 1)
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
