/**
 * GET /health - 健康检查，主项目/运维用
 */
function healthRouter(req, res) {
  res.status(200).json({ status: 'ok' });
}

module.exports = healthRouter;
