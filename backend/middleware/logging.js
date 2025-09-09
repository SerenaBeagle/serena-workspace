const ActionLog = require('../models/ActionLog');

// 获取客户端IP地址
const getClientIP = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         'unknown';
};

// 记录操作日志的中间件
const logAction = (action, targetType, getDescription, getTargetId, getTargetName) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // 在响应发送后记录日志
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // 异步记录日志，不阻塞响应
        setImmediate(async () => {
          try {
            if (req.user) {
              await ActionLog.logAction({
                userId: req.user.id,
                userName: req.user.name,
                action,
                description: getDescription(req, data),
                targetType,
                targetId: getTargetId ? getTargetId(req, data) : null,
                targetName: getTargetName ? getTargetName(req, data) : null,
                metadata: {
                  method: req.method,
                  url: req.originalUrl,
                  statusCode: res.statusCode
                },
                ipAddress: getClientIP(req),
                userAgent: req.get('User-Agent')
              });
            }
          } catch (error) {
            console.error('Failed to log action:', error);
          }
        });
      }
      
      // 调用原始的send方法
      originalSend.call(this, data);
    };
    
    next();
  };
};

// 预定义的操作日志中间件
const logUserRegistration = logAction(
  'user_registered',
  'user',
  (req) => `User registered with email: ${req.body.email}`,
  (req, data) => data?.user?.id,
  (req) => req.body.name
);

const logUserLogin = logAction(
  'user_logged_in',
  'user',
  (req) => `User logged in with email: ${req.body.email}`,
  (req, data) => data?.user?.id,
  (req, data) => data?.user?.name
);

const logProjectCreation = logAction(
  'project_created',
  'project',
  (req) => `Created project: ${req.body.title}`,
  (req, data) => data?.project?.id,
  (req) => req.body.title
);

const logProjectUpdate = logAction(
  'project_updated',
  'project',
  (req) => `Updated project: ${req.body.title || 'Unknown'}`,
  (req) => req.params.id,
  (req) => req.body.title
);

const logPageCreation = logAction(
  'page_created',
  'page',
  (req) => `Created page: ${req.body.title}`,
  (req, data) => data?.page?.id,
  (req) => req.body.title
);

const logPageContentUpdate = logAction(
  'page_content_updated',
  'page',
  (req) => `Updated page content`,
  (req) => req.params.id,
  (req) => req.body.title || 'Unknown'
);

const logPageTitleUpdate = logAction(
  'page_title_updated',
  'page',
  (req) => `Updated page title to: ${req.body.title}`,
  (req) => req.params.id,
  (req) => req.body.title
);

module.exports = {
  logAction,
  logUserRegistration,
  logUserLogin,
  logProjectCreation,
  logProjectUpdate,
  logPageCreation,
  logPageContentUpdate,
  logPageTitleUpdate
};
