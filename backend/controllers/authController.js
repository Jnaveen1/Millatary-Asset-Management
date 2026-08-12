const authService = require('../services/authService');

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const data = await authService.authenticateUser(username, password);
    res.json({
      message: 'Login successful',
      token: data.token,
      user: data.user,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const profile = await authService.getUserProfile(req.user.userId);
    res.json({ user: profile });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
};

module.exports = {
  login,
  getMe,
};
