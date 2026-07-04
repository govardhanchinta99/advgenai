const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authorizeRoles = require('../middleware/authorization');
const blogService = require('../services/blogService');
const { startRun, resumeRun } = require('../services/blogGraph');

router.use(authenticate, authorizeRoles('admin'));

router.post('/generate', async (req, res) => {
    try {
        const { topic } = req.body;
        if (!topic) {
            return res.status(400).json({ error: 'Topic is required' });
        }

        const { blogId, threadId } = await blogService.createBlog({ topic, createdBy: req.user.id });
        await startRun(threadId, { topic, blogId });
        const blog = await blogService.getById(blogId);
        res.status(201).json(blog);
    } catch (error) {
        console.error('Error in /blogs/generate:', error);
        res.status(500).json({ error: 'Failed to generate blog' });
    }
});

router.post("/:id/decision", async (req, res) => {
    try {
        const { action, feedback } = req.body;
        if (!action || (action !== 'approve' && action !== 'reject')) {
            return res.status(400).json({ error: "Action must be 'approve' or 'reject'" });
        }
        const blog = await blogService.getById(req.params.id);
        if (!blog) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        await resumeRun(blog.threadId, { action, feedback });
        const updated = await blogService.getById(req.params.id);
        res.json(updated);
    } catch (error) {
        console.error('Error in /blogs/:id/decision:', error);
        res.status(500).json({ error: 'Failed to submit decision' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const blog = await blogService.getById(req.params.id);
        if (!blog) {
            return res.status(404).json({ error: 'Blog not found' });
        }
        res.json(blog);
    } catch (error) {
        console.error('Error in /blogs/:id:', error);
        res.status(500).json({ error: 'Failed to fetch blog' });
    }
});

router.get("/", async (req, res) => {
    try {
        const blogs = await blogService.listByStatus(req.query.status);
        res.json(blogs);
    } catch (error) {
        console.error('Error in GET /blogs:', error);
        res.status(500).json({ error: 'Failed to list blogs' });
    }
});

module.exports = router;
