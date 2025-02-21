import { Bot, Context, session, type SessionFlavor, InputFile } from "grammy";
import { Menu } from "@grammyjs/menu";
import { hydrate, type HydrateFlavor } from "@grammyjs/hydrate";
import {
    type Conversation,
    type ConversationFlavor,
    conversations,
    createConversation,
} from "@grammyjs/conversations";

interface SessionData {
    name?: string;
    email?: string;
}
type MyContext = ConversationFlavor<Context & SessionFlavor<SessionData>>;

type NameContext = HydrateFlavor<Context>;
type NameConversation = Conversation<MyContext, NameContext>;

type EmailContext = HydrateFlavor<Context>;
type EmailConversation = Conversation<MyContext, EmailContext>;


const pizza = {
    id: 'pepperoni',
    name: 'Pepperoni',
    source: 'https://riotfest.org/wp-content/uploads/2016/10/p-evid1.jpg',
};
const bot = new Bot<MyContext>("8056950160:AAGIF7ColbOQH5wF6lhWC2HNAib5mb624K8");

bot.use(session({ initial: () => ({}) }));
bot.use(conversations());

const menu = new Menu<MyContext>("root")
    .submenu("لیست", "settings")
    .row()
    .submenu("درباره", "about");

const settings = new Menu<MyContext>("settings")
    .text(
        // The label to display:
        (ctx) => {
            const name = ctx.session.name;
            return name ? `تیتر: ${name}` : "تیتر خبر تنظیم نشده است.";
        },
        // The button's handler:
        (ctx) => ctx.conversation.enter("name"),
    )
    .row()
    .text(
        // The label to display:
        (ctx) => {
            const email = ctx.session.email;
            return email ? `زیرتیتر: ${email}` : "زیرتیتر خبر تنظیم نشده است.";
        },
        // The button's handler:
        (ctx) => ctx.conversation.enter("email"),
    )
    .row()
    .back("بازگشت");
menu.register(settings);

const about = new Menu<MyContext>("about")
    .back("بازگشت");
menu.register(about);

async function name(conversation: NameConversation, ctx: NameContext) {
   
    // Override the outside menu when the conversation is entered.
    const nameMenu = conversation.menu().text("کنسل", async (ctx) => {
        await ctx.menu.nav("settings", { immediate: true });
        await conversation.halt();
    });

    await ctx.editMessageReplyMarkup({ reply_markup: nameMenu });

    const question = await ctx.reply("تیتر خبر را وارد کنید.");

    const name = await conversation.form.text({
        action: (ctx) => ctx.deleteMessage(),
    });
    await conversation.external((ctx: MyContext) => ctx.session.name = name);

    const currentName = await conversation.external((ctx) => ctx.session.name);
    const currentEmail = await conversation.external((ctx) => ctx.session.email);

    // Define the structure that the ouside menu expects.
    const settingsClone = conversation.menu("settings")
        .text(currentName ? `تیتر: ${currentName}` : "تیتر خبر تنظیم نشده است.")
        .row()
        .text(currentEmail ? `زیرتیتر: ${currentEmail}` : "زیرتیتر خبر تنظیم نشده است.")
        .row()
        .back("بازگشت");
    
    await Promise.all([
        question.delete(),
        ctx.reply("تیتر تنظیم شد!"),
        await ctx.editMessageReplyMarkup({ reply_markup: settingsClone })
    ]);
}
async function email(conversation: EmailConversation, ctx: EmailContext) {
    
    // Override the outside menu when the conversation is entered.
    const emailMenu = conversation.menu().text("کنسل", async (ctx) => {
        await ctx.menu.nav("settings", { immediate: true });
        await conversation.halt();
    });

    await ctx.editMessageReplyMarkup({ reply_markup: emailMenu });

    const currentName = await conversation.external((ctx) => ctx.session.name);
    const question = await ctx.reply(
        "زیرتیتر خبر را وارد کنید."
    );
    
    const email = await conversation.form.text({
        action: (ctx) => ctx.deleteMessage(),
    });
    
    await conversation.external((ctx: MyContext) => ctx.session.email = email);

    const currentEmail = await conversation.external((ctx) => ctx.session.email);

    // Define the structure that the ouside menu expects.
    const settingsClone = conversation.menu("settings")
        .text(currentName ? `تیتر: ${currentName}` : "تیتر خبر تنظیم نشده است.")
        .row()
        .text(currentEmail ? `زیرتیتر: ${currentEmail}` : "زیرتیتر خبر تنظیم نشده است.")
        .row()
        .back("بازگشت");
    
    await Promise.all([
        question.delete(),
        ctx.reply("زیرتیتر تنظیم شد!"),
        ctx.editMessageReplyMarkup({ reply_markup: settingsClone }),
    ]);
}

bot.use(createConversation(name, { plugins: [hydrate()] }));
bot.use(createConversation(email, { plugins: [hydrate()] }));
bot.use(menu);

bot.command("start", async (ctx) => {
    await ctx.replyWithPhoto(
        new InputFile({ url: pizza.source }),
            {
                caption: pizza.name,
                reply_markup: menu ,
            });
});

bot.use((ctx) => ctx.reply("Send /start"));

bot.start();
