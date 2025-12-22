/** Keep the chatter attachment panel expanded by default for better visibility. */
import { Chatter } from "@mail/chatter/web_portal/chatter";

// Version marker for debugging asset loading in console.
console.info("OnlyOffice chatter UX patch loaded (v5.3.1)");

Chatter.defaultProps = {
    ...Chatter.defaultProps,
    isAttachmentBoxVisibleInitially: true,
};
