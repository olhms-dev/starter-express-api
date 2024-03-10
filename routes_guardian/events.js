const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const Event = require('../models/events');
const Comment = require('../models/comment');

const yearChecker = require("../functions/yearChecker");

dotenv.config();
const router = express.Router();


// endpoint to view event
router.post('/view_event', async (req, res) => {
    const { event_id } = req.body;

    // check for required fields
    if (!event_id)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    try {
        // verify token
        // jwt.verify(token, process.env.JWT_SECRET);

        // fetch event document
        const event = await Event.findByIdAndUpdate({ _id: event_id }, { $inc: { view_count: 1 } }, { new: true }).lean();

        return res.status(200).send({ status: 'ok', msg: 'success', event });

    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

/**
 * Endpoint to view events 
 * This endpoint has been tweaked to view the events for that year
 * It will be revamped later on
 */
router.post('/view_events', async (req, res) => {
    const { pagec } = req.body;

    // check for required fields
    if (!pagec)
        return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    try {
        // verify token
        // jwt.verify(token, process.env.JWT_SECRET);

        const resultsPerPage = 200;
        let page = pagec >= 1 ? pagec : 1;
        page = page - 1;

        // fetch event document
        const events = await Event.find(
            { is_deleted: false, category: "events" }
        ).sort({ "timestamp": "desc" }).limit(resultsPerPage).skip(resultsPerPage * page).lean();

        // check if events exist
        if (events.length === 0)
            return res.status(200).send({ status: 'ok', msg: 'no events at the moment', count: 0 });

        const eventsM = [];
        // check the event date and return events for the current year
        events.forEach(event => {
            if (yearChecker(event.event_date)) {
                eventsM.push(event);
            }
        });

        return res.status(200).send({ status: 'ok', msg: 'success', events: eventsM, count: eventsM.length });

    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

// endpoint to view events based on view count
router.post('/view_events_based_on_view_count', async (req, res) => {
    const { } = req.body;

    // check for required fields
    // if (!token)
    //     return res.status(400).send({ status: 'error', msg: 'all fields must be filled' });

    try {
        // verify token
        // jwt.verify(token, process.env.JWT_SECRET);

        // fetch event document
        const events = await Event.find(
            { is_deleted: false },
            { is_deleted: 0, img_id: 0 }
        ).sort({ view_count: 'asc' })
            .lean();

        // check if events exist
        if (events.length === 0)
            return res.status(200).send({ status: 'ok', msg: 'no events at the moment', count: 0 });

        return res.status(200).send({ status: 'ok', msg: 'success', events, count: events.length });

    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: 'error', msg: 'some error occurred', e });
    }
});

/**
 * Endpoint to view events based on term
 * @param {Number} term 1 for first term 2 for second term and three for third term
 */
router.post("/view_term_events", async (req, res) => {
    const { term } = req.body;

    // check for required fields
    if (!term)
        return res.status(400).send({ status: 'error', msg: "all fields must be filled" });
    try {
        // verify token
        // const Admin = jwt.verify(token, process.env.JWT_SECRET);

        // fetch event document
        const events = await Event.find(
            { is_deleted: false, category: "events", term },
            { is_deleted: 0, img_id: 0 }
        ).sort({ timestamp: -1 }).lean();

        // check if events exist
        if (events.length === 0)
            return res
                .status(200)
                .send({ status: "ok", msg: "no events at the moment", count: 0 });

        const eventsM = [];

        // check the event date and return events for the current year
        events.forEach(event => {
            if (yearChecker(event.event_date)) {
                eventsM.push(event);
            }
        });

        return res
            .status(200)
            .send({ status: "ok", msg: "success", events: eventsM, count: eventsM.length });
    } catch (e) {
        console.log(e);
        return res
            .status(500)
            .send({ status: "error", msg: "some error occurred", e });
    }
});

// endpoint to make a comment on an event
router.post('/comment', async (req, res) => {
    const { token, comment, event_id, owner_name, owner_img } = req.body;

    if (!token || !event_id || !comment || !owner_name) {
        return res.status(400).send({ status: 'error', msg: 'All fields must be filled' });
    }

    const timestamp = Date.now();

    try {
        let user = jwt.verify(token, process.env.JWT_SECRET);

        let mComment = await new Comment;
        mComment.comment = comment;
        mComment.post_id = event_id;
        mComment.owner_id = user._id;
        mComment.owner_name = owner_name;
        mComment.owner_img = owner_img || '';
        mComment.timestamp = timestamp;
        await mComment.save();

        const event = await Event.findOneAndUpdate(
            { _id: event_id },
            { "$inc": { comment_count: 1 } },
            { new: true }
        );
        return res.status(200).send({ status: 'ok', msg: 'success', event, comment: mComment.comment, comment_doc: mComment });

    } catch (e) {
        console.log(e);
        return res.status({ status: 'error', msg: 'An error occured' });
    }
});

// endpoint to get comments of a event
router.post('/get_comments', async (req, res) => {
    const { token, event_id, pagec } = req.body;

    if (!token || !event_id || !pagec) {
        return res.status(400).send({ status: 'error', msg: 'All fields must be filled' });
    }

    try {
        jwt.verify(token, process.env.JWT_SECRET);

        const resultsPerPage = 2;
        let page = pagec >= 1 ? pagec : 1;
        page = page - 1;

        const comments = await Comment.find({ post_id: event_id })
            .sort({ timestamp: 'desc' })
            .limit(resultsPerPage)
            .skip(resultsPerPage * page)
            .lean();

        return res.status(200).send({ status: 'ok', msg: 'success', comments });
    } catch (e) {
        console.log(e);
        return res.status({ status: 'error', msg: 'An error occured' });
    }
});

// endpoint to delete a comment
router.post('/delete_comment', async (req, res) => {
    const { token, _id, event_id } = req.body;

    // check for required fields
    if (!token || !_id || !event_id)
        return res.status(400).send({ status: 'error', msg: 'All fields must be filled' });

    try {
        // token verification
        jwt.verify(token, process.env.JWT_SECRET);

        // delete comment
        const comment = await Comment.findOneAndDelete({ _id });
        if (!comment)
            return res.status(400).send({ status: 'error', msg: 'Comment not found' });

        // update event document
        const event = await Event.findOneAndUpdate(
            { _id: event_id },
            { '$inc': { comment_count: -1 } },
            { new: true }
        ).lean();

        return res.status(200).send({ status: 'ok', msg: 'Comment deleted successfully', event });
    } catch (e) {
        console.log(e);
        return res.status(400).send({ status: 'error', msg: 'Some error occurred' });
    }
});
// endpoint to edit a comment 
router.post('/edit_comment', async (req, res) => {
    const { token, _id, comment_body } = req.body;

    if (!token, _id)
        return res.status(400).send({ status: 'error', msg: 'All fields must be filled' });

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET);

        let comment = await Comment.findOneAndUpdate(
            { _id },
            {
                edited: true,
                comment: comment_body || comment.comment
            },
            { new: true }
        );
        if (!comment)
            return res.status(404).send({ status: 'ENOENT', msg: 'Comment not found' });

        return res.status(200).send({ status: 'ok', msg: 'Comment updated successfully', comment });
    } catch (e) {
        console.log(e);
        return res.status(400).send({ status: 'error', msg: 'Some error occurred' })
    }
});

//endpoint to reply a comment
router.post('/reply_comment', async (req, res) => {
    const { _id, token, comment_body, owner_img, owner_name } = req.body;
    // the _id field is the _id of the document that a comment is being made on

    if (!_id || !token)
        return res.status(400).send({ status: 'error', msg: 'All fields must be filled' });

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET);

        let comment = await Comment.findByIdAndUpdate(
            { _id },
            { '$inc': { reply_count: 1 } },
            { new: true }
        ).lean();

        comment = await new Comment;
        comment.comment = comment_body;
        comment.comment_id = _id;
        comment.owner_id = user._id;
        comment.owner_name = owner_name;
        comment.owner_img = owner_img || '';

        comment.save();
        return res.status(200).send({ status: 'ok', msg: 'success', comment: comment.comment_body, comment_doc: comment });

    } catch (e) {
        console.log(e);
        return res.status(400).send({ status: 'error', msg: 'Some error occurred', e });
    }
});

// endpoint to get replies of a comment
router.post('/get_replies_of_comment', async (req, res) => {
    const { token, comment_id, pagec } = req.body;

    if (!token || !comment_id || !pagec) {
        return res.status(400).send({ status: 'error', msg: 'All fields must be filled' });
    }

    try {
        jwt.verify(token, process.env.JWT_SECRET);

        const resultsPerPage = 10;
        let page = pagec >= 1 ? pagec : 1;
        page = page - 1;

        const comments = await Comment.find({ comment_id })
            .sort({ timestamp: 'desc' })
            .limit(resultsPerPage)
            .skip(resultsPerPage * page)
            .lean();

        return res.status(200).send({ status: 'ok', msg: 'success', comments });
    } catch (e) {
        console.log(e);
        return res.status({ status: 'error', msg: 'An error occured' });
    }
});

// endpoint to like a news
router.post('/like_news', async (req, res) => {
    const { token, news_id } = req.body;

    // check for required fields
    if (!token || !news_id) {
        return res.status(400).send({ status: 'error', msg: 'All fields must be filled' });
    }

    try {
        // token verification
        let user = jwt.verify(token, process.env.JWT_SECRET);

        // check if news has been liked
        const found = await Event.findOne({ _id: news_id, likes: user._id });
        if (found)
            return res.status(400).send({ status: 'error', msg: 'You already liked this news' });

        // edit the news document
        const news = await Event.findByIdAndUpdate(
            { _id: news_id },
            {
                "$push": { likes: user._id },
                "$inc": { like_count: 1 }
            },
            { new: true }
        ).lean();

        return res.status(200).send({ status: 'ok', msg: 'Success', news });

    } catch (e) {
        console.log(e);
        return res.status({ status: 'error', msg: 'An error occured', e });
    }
});

// endpoint to like a comment on a news
router.post('/comment_like', async (req, res) => {
    const { token, comment_id } = req.body;

    // check for required fields
    if (!token || !comment_id)
        return res.status(400).send({ status: 'error', msg: 'All fields must be filled' });

    try {
        // token verification
        const user = jwt.verify(token, process.env.JWT_SECRET);

        // check if comment has been liked
        let comment = await Comment.findOne({ _id: comment_id, likes: user._id }).lean();
        if (comment)
            return res.status(400).send({ status: 'error', msg: "You've already liked this comment" });

        // edit the comment document
        comment = await Comment.findByIdAndUpdate(
            { _id: comment_id },
            {
                '$push': { likes: user._id },
                '$inc': { like_count: 1 }
            },
            { new: true }
        );

        return res.status(200).send({ status: 'ok', msg: 'Comment liked successfully', comment });
    } catch (e) {
        console.log(e);
        return res.status(400).send({ status: 'error', msg: 'Some error occurred', e });
    }
})

// endpoint to unlike a news
router.post('/unlike_news', async (req, res) => {
    const { token, news_id } = req.body;

    // check for required fields
    if (!token || !news_id) {
        return res.status(400).send({ status: 'error', msg: 'All fields must be filled' });
    }

    try {
        // token verification
        let user = jwt.verify(token, process.env.JWT_SECRET);

        // check if comment has been unliked
        const found = await Event.findOne({ _id: news_id, likes: user._id });
        if (!found)
            return res.status(400).send({ status: 'error', msg: 'You haven\'t liked this news before' });

        // edit the news document
        const news = await Event.findByIdAndUpdate(
            { _id: news_id },
            {
                "$pull": { likes: user._id },
                "$inc": { like_count: -1 }
            },
            { new: true }
        ).lean();

        return res.status(200).send({ status: 'ok', msg: 'Success', news });

    } catch (e) {
        console.log(e);
        return res.status({ status: 'error', msg: 'An error occured', e });
    }
});

// endpoint to unlike a comment on a news
router.post('/unlike_comment', async (req, res) => {
    const { comment_id, token } = req.body;

    // check for required fields
    if (!comment_id || !token)
        return res.status(400).send({ status: 'error', msg: 'All fields must be filled' });

    try {
        // token verification
        const user = jwt.verify(token, process.env.JWT_SECRET);

        // check if comment has been unliked before
        let comment = Comment.findOne({ _id: comment_id, likes: user._id }).lean();
        if (!comment)
            return res.status(400).send({ status: 'error', msg: 'You have not liked this comment before' });

        // edit comment document
        comment = await Comment.findOneAndUpdate(
            { _id: comment_id, likes: user._id },
            {
                '$pull': { likes: user._id },
                '$inc': { like_count: -1 }
            }
        ).lean();

        return res.status(200).send({ status: 'ok', msg: 'Comment liked successfully', comment });
    } catch (e) {
        console.log(e);
        return res(400).send({ status: 'error', msg: 'Some error occurred', e })
    }
});

module.exports = router;