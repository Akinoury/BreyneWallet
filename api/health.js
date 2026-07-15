export default function handler(req, res) {
  res.json({ status: 'ok', method: req.method })
}
