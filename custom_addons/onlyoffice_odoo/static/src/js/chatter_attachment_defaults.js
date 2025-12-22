/** Keep the chatter attachment panel expanded by default for better visibility. */
import { Chatter } from "@mail/chatter/web_portal/chatter";

Chatter.defaultProps = {
    ...Chatter.defaultProps,
    isAttachmentBoxVisibleInitially: true,
};
