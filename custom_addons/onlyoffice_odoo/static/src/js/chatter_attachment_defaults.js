/** Keep the chatter attachment panel expanded by default for better visibility. */
import { Chatter } from "@mail/chatter/web_portal/chatter";
import { patch } from "@web/core/utils/patch";

// Version marker for debugging asset loading in console.
console.info("OnlyOffice chatter UX patch loaded (v5.3.3)");

Chatter.defaultProps = {
    ...Chatter.defaultProps,
    isAttachmentBoxVisibleInitially: true,
};

// Force the attachment box open at setup to avoid regressions when defaultProps
// are bypassed or state is reset during load.
const superSetup = Chatter.prototype.setup;
patch(Chatter.prototype, {
    setup() {
        superSetup.call(this, ...arguments);
        this.state.isAttachmentBoxOpened = true;
    },
});
