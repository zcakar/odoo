/** @odoo-module **/

/*
 *
 * (c) Copyright Ascensio System SIA 2024
 *
 */

import { Attachment } from "@mail/core/common/attachment_model"
import { patch } from "@web/core/utils/patch"

/** @type {import("models").Attachment} */
const attachmentPatch = {
  /** OnlyOffice attachment version number */
  oo_attachment_version: undefined,
  /** Whether this is a historical snapshot (hidden from main list) */
  oo_is_snapshot: undefined,
  /** Origin attachment ID for snapshots */
  oo_origin_attachment_id: undefined,
}

patch(Attachment.prototype, attachmentPatch)

