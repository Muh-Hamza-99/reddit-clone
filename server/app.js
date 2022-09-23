require("dotenv").config({ path: "./env" })

const fastify = require("fastify");
const app = fastify();

const sensible = require("@fastify/sensible");
const CORS = require("@fastify/cors");
const cookies = require("@fastify/cookie");
const prisma = require("./database/prisma");

app.register(sensible);
app.register(cookies, { secret: process.env.COOKIE_SECRET });
app.register(CORS, { origin: process.env.CLIENT_URL, credentials: true });

app.addHook("onRequest", async (req, res) => {
    const CURRENT_USER_ID = (await prisma.user.findFirst({ where: { name: "Kyle" } })).id;
    if (req.cookies.userID !== CURRENT_USER_ID) {
        req.cookies.userID = CURRENT_USER_ID;
        res.clearCookie("userID");
        res.setCookie("userID", CURRENT_USER_ID);
    };
});

app.get("/posts", async (req, res) => {
    return await commitToDB(prisma.post.findMany({ select: { id: true, title: true } }));
});

app.get("/posts/:id", async (req, res) => {
    const { id } = req.params;
    return await commitToDB(prisma.post.findUnique({ where: { id }, select: { body: true, title: true, comments: { orderBy: { createdAt: "desc" }, select: { id: true, message: true, parentID: true, createdAt: true, user: { select: { id: true, name: true } }, _count: { select: { likes: true } } } } } })).then(async post => {
        const likes = await prisma.like.findMany({ where: { userID: req.cookies.userID, commentID: { in: post.comments.map(comment => comment.id) } } });
        return { ...post, comments: post.comments.map(comment => {
            const { _count, ...commentFields } = comment;
            return { ...commentFields, likedByMe: likes.find(like => like.commentID === comment.id), likeCount: _count.likes };
        })};
    });
});

app.post("/posts/:id/comments", async (req, res) => {
    const { message, parentID } = req.body;
    const { id } = req.params;
    const { userID } = req.cookies;
    if (!message) return res.send(app.httpErrors.badRequest("Message is required!"));
    return await commitToDB(prisma.comment.create({ data: { message, userID, parentID, postID: id }, select: { id: true, message: true, parentID: true, createdAt: true, user: { select: { id: true, name: true } } } })).then(comment => { return { likedByMe: false, likeCount: 0, ...comment } });
});

app.put("/posts/:postID/comments/:commentID", async (req, res) => {
    const { message } = req.body;
    const { commentID } = req.params;
    if (!message) return res.send(app.httpErrors.badRequest("Message is required"));
    const comment = await prisma.comment.findUnique({ where: { id: commentID }, select: { userID: true } });
    if (comment.userID !== req.cookies.userID) return res.send(app.httpErrors.unauthorized("You do not have permission to edit this message"));
    return await commitToDB(prisma.comment.update({ where: { id: commentID }, data: { message }, select: { message: true } }));
});

app.delete("/posts/:postID/comments/:commentID", async (req, res) => {
    const { commentID } = req.params;
    const comment = await prisma.comment.findUnique({ where: { id: commentID }, select: { userID: true } });
    if (comment.userID !== req.cookies.userID) return res.send(app.httpErrors.unauthorized("You do not have permission to delete this message"));
    return await commitToDB(prisma.comment.delete({ where: { id: commentID }, select: { id: true } }));
});

app.post("/posts/:postID/comments/:commentID/toggleLike", async (req, res) => {
    const { commentID } = req.params;
    const { userID } = req.cookies;
    const data = { commentID, userID };
    const like = await prisma.like.findUnique({ where: { userID_commentID: data } });
    if (!like) return await commitToDB(prisma.like.create({ data })).then(() => { addLike: true });
    else return await commitToDB(prisma.like.delete({ where: { userID_commentID: data} })).then(() => { addLike: false });
});

const commitToDB = async promise => {
    const [error, data] = await app.to(promise);
    if (error) return app.httpErrors.internalServerError(error.message);
    return data;
};

const PORT = process.env.PORT || 5000;

app.listen({ port: PORT });