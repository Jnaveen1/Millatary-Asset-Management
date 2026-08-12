const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Access restricted to roles [${allowedRoles.join(', ')}]`,
      });
    }
    next();
  };
};

const enforceBaseAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthenticated user' });
  }

  // ADMIN has unrestricted global access
  if (req.user.role === 'ADMIN') {
    return next();
  }

  const userBaseId = Number(req.user.baseId);

  // BASE_COMMANDER must only access their assigned base
  if (req.user.role === 'BASE_COMMANDER') {
    // If baseId passed in body for creation / mutation
    if (req.body.baseId && Number(req.body.baseId) !== userBaseId) {
      return res.status(403).json({
        error: `Forbidden: Base Commanders are restricted to their assigned base (Base #${userBaseId})`,
      });
    }

    if (req.body.sourceBaseId && Number(req.body.sourceBaseId) !== userBaseId) {
      return res.status(403).json({
        error: `Forbidden: Transfers must originate from your assigned base (Base #${userBaseId})`,
      });
    }

    // For GET queries, automatically lock/enforce query parameter to their base
    if (req.query.baseId && Number(req.query.baseId) !== userBaseId) {
      return res.status(403).json({
        error: `Forbidden: Cannot view metrics for other bases`,
      });
    }

    // Default target query baseId to user's assigned base if not explicitly set
    req.query.baseId = userBaseId;
  }

  next();
};

module.exports = {
  authorizeRoles,
  enforceBaseAccess,
};
