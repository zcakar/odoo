/** Keep the chatter attachment panel expanded by default for better visibility. */
import { Chatter } from "@mail/chatter/web_portal/chatter";
import { patch } from "@web/core/utils/patch";
import { _t } from "@web/core/l10n/translation";
import { useService } from "@web/core/utils/hooks";
import { Dropdown } from "@web/core/dropdown/dropdown";
import { DropdownItem } from "@web/core/dropdown/dropdown_item";

// Version marker for debugging asset loading in console.
console.info("OnlyOffice chatter UX patch loaded (v5.3.8)");

Chatter.defaultProps = {
    ...Chatter.defaultProps,
    isAttachmentBoxVisibleInitially: true,
};

// Add Dropdown components to Chatter
Chatter.components = {
    ...Chatter.components,
    Dropdown,
    DropdownItem,
};

// Force the attachment box open at setup to avoid regressions when defaultProps
// are bypassed or state is reset during load.
const superSetup = Chatter.prototype.setup;
patch(Chatter.prototype, {
    setup() {
        superSetup.call(this, ...arguments);
        this.state.isAttachmentBoxOpened = true;
        this.notification = useService("notification");
        this.orm = useService("orm");
        this.store = useService("mail.store");
        // Expose handler for template dropdown (used in QWeb)
        this.onClickCreateNewDoc = this.onClickCreateNewDoc.bind(this);
    },

    async onClickCreateNewDoc(ext) {
        if (!this.props.threadModel || !this.props.threadId) {
            this.notification.add(_t("No record context found to attach the document."));
            return;
        }
        const defaultNames = {
            docx: _t("New Document"),
            xlsx: _t("New Spreadsheet"),
            pptx: _t("New Presentation"),
        };
        const extLower = (ext || "docx").toLowerCase();
        const defaultName = defaultNames[extLower] || defaultNames.docx;
        const nameInput = window.prompt(_t("Enter file name"), defaultName);
        if (!nameInput) {
            return;
        }
        const trimmed = nameInput.trim();
        if (!trimmed) {
            this.notification.add(_t("File name is required."));
            return;
        }
        const safeName = trimmed.toLowerCase().endsWith(`.${extLower}`) ? trimmed : `${trimmed}.${extLower}`;
        try {
            await this.orm.call("ir.attachment", "onlyoffice_create_new", [], {
                res_model: this.props.threadModel,
                res_id: this.props.threadId,
                file_type: extLower,
                file_name: safeName,
            });
            if (this.store?.fetchStoreData) {
                await this.store.fetchStoreData("mail.thread", {
                    thread_model: this.props.threadModel,
                    thread_id: this.props.threadId,
                    request_list: ["attachments"],
                });
            }
            this.state.isAttachmentBoxOpened = true;
        } catch (error) {
            const message = error?.message || error || _t("Could not create document.");
            this.notification.add(_t("Failed to create document: %s", message));
        }
    },
});
