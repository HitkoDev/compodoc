'use strict';

var logger = require('./logger-kbUbohEP.js');
var path = require('path');
var fs = require('fs-extra');
var http = require('http');
var crypto = require('crypto');
var os = require('os');
var child_process = require('child_process');

function _interopNamespaceDefault(e) {
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n.default = e;
    return Object.freeze(n);
}

var path__namespace = /*#__PURE__*/_interopNamespaceDefault(path);
var fs__namespace = /*#__PURE__*/_interopNamespaceDefault(fs);
var http__namespace = /*#__PURE__*/_interopNamespaceDefault(http);
var crypto__namespace = /*#__PURE__*/_interopNamespaceDefault(crypto);
var os__namespace = /*#__PURE__*/_interopNamespaceDefault(os);

var express = require('express');
var archiver = require('archiver');
var TemplatePlaygroundServer = /** @class */ (function () {
    function TemplatePlaygroundServer(port) {
        this.sessions = new Map();
        this.ipToSessionId = new Map();
        this.debounceTimers = new Map();
        this.signalHandlers = new Map();
        this.port = port || parseInt(process.env.PLAYGROUND_PORT || process.env.PORT || '3001', 10);
        this.app = express();
        this.setupPaths();
        this.initializeHandlebars();
        this.setupMiddleware();
        this.setupRoutes();
        this.startSessionCleanup();
        this.setupSignalHandlers();
    }
    TemplatePlaygroundServer.prototype.setupSignalHandlers = function () {
        var _this = this;
        // Only set up signal handlers if we're not in a test environment
        // or if this is the first instance (prevent memory leaks in tests)
        if (process.env.NODE_ENV === 'test' && process.listenerCount('SIGINT') > 0) {
            return;
        }
        // Handle CTRL+C (SIGINT) and other termination signals
        var signals = ['SIGINT', 'SIGTERM', 'SIGUSR2'];
        signals.forEach(function (signal) {
            var handler = function () { return logger.__awaiter(_this, void 0, void 0, function () {
                var error_1;
                return logger.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            logger.logger.info("Received ".concat(signal, ", shutting down Template Playground server gracefully..."));
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.stop()];
                        case 2:
                            _a.sent();
                            logger.logger.info('Server shutdown complete');
                            process.exit(0);
                            return [3 /*break*/, 4];
                        case 3:
                            error_1 = _a.sent();
                            logger.logger.error('Error during server shutdown:', error_1);
                            process.exit(1);
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            }); };
            _this.signalHandlers.set(signal, handler);
            process.on(signal, handler);
        });
        // Handle uncaught exceptions (only if not already handled)
        if (process.listenerCount('uncaughtException') === 0) {
            var uncaughtHandler = function (error) { return logger.__awaiter(_this, void 0, void 0, function () {
                var stopError_1;
                return logger.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            logger.logger.error('Uncaught exception:', error);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.stop()];
                        case 2:
                            _a.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            stopError_1 = _a.sent();
                            logger.logger.error('Error during emergency shutdown:', stopError_1);
                            return [3 /*break*/, 4];
                        case 4:
                            process.exit(1);
                            return [2 /*return*/];
                    }
                });
            }); };
            this.signalHandlers.set('uncaughtException', uncaughtHandler);
            process.on('uncaughtException', uncaughtHandler);
        }
        // Handle unhandled promise rejections (only if not already handled)
        if (process.listenerCount('unhandledRejection') === 0) {
            var rejectionHandler = function (reason, promise) { return logger.__awaiter(_this, void 0, void 0, function () {
                var stopError_2;
                return logger.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            logger.logger.error('Unhandled rejection at:', promise, 'reason:', reason);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.stop()];
                        case 2:
                            _a.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            stopError_2 = _a.sent();
                            logger.logger.error('Error during emergency shutdown:', stopError_2);
                            return [3 /*break*/, 4];
                        case 4:
                            process.exit(1);
                            return [2 /*return*/];
                    }
                });
            }); };
            this.signalHandlers.set('unhandledRejection', rejectionHandler);
            process.on('unhandledRejection', rejectionHandler);
        }
    };
    TemplatePlaygroundServer.prototype.setupPaths = function () {
        // Try to find paths for distributed package first, then fall back to development paths
        // For playground-demo: check resources/playground-demo first, then src directory
        var distributedFakeProjectPath = path__namespace.join(__dirname, 'resources', 'playground-demo');
        var devFakeProjectPath = path__namespace.join(process.cwd(), 'src', 'playground-demo');
        if (fs__namespace.existsSync(distributedFakeProjectPath)) {
            this.fakeProjectPath = distributedFakeProjectPath;
        }
        else if (fs__namespace.existsSync(devFakeProjectPath)) {
            this.fakeProjectPath = devFakeProjectPath;
        }
        else {
            throw new Error('playground-demo directory not found. Please ensure it exists.');
        }
        // For templates: check if we're running from dist (distributed) or development
        var distributedTemplatesPath = path__namespace.join(__dirname, 'templates'); // When running from dist/, this is dist/templates
        var devTemplatesPath = path__namespace.join(process.cwd(), 'src', 'templates');
        var legacyTemplatesPath = path__namespace.join(process.cwd(), 'hbs-templates-copy');
        if (fs__namespace.existsSync(distributedTemplatesPath)) {
            this.originalTemplatesPath = distributedTemplatesPath;
        }
        else if (fs__namespace.existsSync(devTemplatesPath)) {
            this.originalTemplatesPath = devTemplatesPath;
        }
        else if (fs__namespace.existsSync(legacyTemplatesPath)) {
            // Keep legacy support for existing hbs-templates-copy
            this.originalTemplatesPath = legacyTemplatesPath;
        }
        else {
            throw new Error('Templates directory not found. Please ensure src/templates or dist/templates exists.');
        }
    };
    TemplatePlaygroundServer.prototype.getClientIP = function (req) {
        // Get IP address from various headers (handles proxies, load balancers, etc.)
        var forwarded = req.headers['x-forwarded-for'];
        var realIP = req.headers['x-real-ip'];
        var remoteAddr = req.socket.remoteAddress;
        var ip = (forwarded === null || forwarded === void 0 ? void 0 : forwarded.split(',')[0]) || realIP || remoteAddr || 'unknown';
        // Clean up IPv6 localhost
        if (ip === '::1' || ip === '::ffff:127.0.0.1') {
            ip = '127.0.0.1';
        }
        return ip;
    };
    TemplatePlaygroundServer.prototype.generateSessionIdFromIP = function (ip) {
        // Create a consistent hash from IP address
        return crypto__namespace.createHash('md5').update(ip + 'template-playground-salt').digest('hex');
    };
    TemplatePlaygroundServer.prototype.createOrGetSessionByIP = function (ip) {
        // Check if session already exists for this IP
        var existingSessionId = this.ipToSessionId.get(ip);
        if (existingSessionId && this.sessions.has(existingSessionId)) {
            var session_1 = this.sessions.get(existingSessionId);
            // Update last activity
            session_1.lastActivity = Date.now();
            logger.logger.info("\u267B\uFE0F  Reusing existing session for IP ".concat(ip, ": ").concat(existingSessionId));
            return session_1;
        }
        // Create new session
        var sessionId = this.generateSessionIdFromIP(ip);
        var templateDir = path__namespace.join(os__namespace.tmpdir(), "hbs-templates-copy-".concat(sessionId));
        var documentationDir = path__namespace.join(os__namespace.tmpdir(), "generated-documentation-".concat(sessionId));
        // Clean up any existing directories from previous sessions
        if (fs__namespace.existsSync(templateDir)) {
            fs__namespace.removeSync(templateDir);
        }
        if (fs__namespace.existsSync(documentationDir)) {
            fs__namespace.removeSync(documentationDir);
        }
        // Copy original templates to session directory
        fs__namespace.copySync(this.originalTemplatesPath, templateDir);
        fs__namespace.ensureDirSync(documentationDir);
        var session = {
            id: sessionId,
            templateDir: templateDir,
            documentationDir: documentationDir,
            lastActivity: Date.now(),
            config: {
                hideGenerator: false,
                disableSourceCode: false,
                disableGraph: false,
                disableCoverage: false,
                disablePrivate: false,
                disableProtected: false,
                disableInternal: false
            }
        };
        this.sessions.set(sessionId, session);
        this.ipToSessionId.set(ip, sessionId);
        logger.logger.info("\uD83C\uDD95 Created new session for IP ".concat(ip, ": ").concat(sessionId));
        // Generate initial documentation (skip in test mode to avoid template issues)
        if (process.env.NODE_ENV !== 'test') {
            this.generateDocumentation(sessionId);
        }
        return session;
    };
    TemplatePlaygroundServer.prototype.createNewSession = function (ip) {
        // Generate a unique session ID (not based on IP)
        var sessionId = crypto__namespace.randomBytes(16).toString('hex');
        var templateDir = path__namespace.join(os__namespace.tmpdir(), "hbs-templates-copy-".concat(sessionId));
        var documentationDir = path__namespace.join(os__namespace.tmpdir(), "generated-documentation-".concat(sessionId));
        // Clean up any existing directories from previous sessions
        if (fs__namespace.existsSync(templateDir)) {
            fs__namespace.removeSync(templateDir);
        }
        if (fs__namespace.existsSync(documentationDir)) {
            fs__namespace.removeSync(documentationDir);
        }
        // Copy original templates to session directory
        fs__namespace.copySync(this.originalTemplatesPath, templateDir);
        fs__namespace.ensureDirSync(documentationDir);
        var session = {
            id: sessionId,
            templateDir: templateDir,
            documentationDir: documentationDir,
            lastActivity: Date.now(),
            config: {
                hideGenerator: false,
                disableSourceCode: false,
                disableGraph: false,
                disableCoverage: false,
                disablePrivate: false,
                disableProtected: false,
                disableInternal: false
            }
        };
        this.sessions.set(sessionId, session);
        // Don't update ipToSessionId mapping for new sessions to allow multiple sessions per IP
        logger.logger.info("\uD83C\uDD95 Created new session for IP ".concat(ip, ": ").concat(sessionId));
        // Generate initial documentation (skip in test mode to avoid template issues)
        if (process.env.NODE_ENV !== 'test') {
            this.generateDocumentation(sessionId);
        }
        return session;
    };
    TemplatePlaygroundServer.prototype.updateSessionActivity = function (sessionId) {
        var session = this.sessions.get(sessionId);
        if (session) {
            session.lastActivity = Date.now();
        }
    };
    TemplatePlaygroundServer.prototype.generateDocumentation = function (sessionId, debounce) {
        var _this = this;
        if (debounce === void 0) { debounce = false; }
        if (debounce) {
            // Clear existing timer
            var existingTimer = this.debounceTimers.get(sessionId);
            if (existingTimer) {
                clearTimeout(existingTimer);
            }
            // Set new timer for 300ms
            var timer = setTimeout(function () {
                _this.runCompoDocForSession(sessionId);
                _this.debounceTimers.delete(sessionId);
            }, 300);
            this.debounceTimers.set(sessionId, timer);
        }
        else {
            // Generate immediately
            this.runCompoDocForSession(sessionId);
        }
    };
    TemplatePlaygroundServer.prototype.runCompoDocForSession = function (sessionId) {
        return logger.__awaiter(this, void 0, void 0, function () {
            var session, fakeProjectTsConfigPath, cliPath, cmd, config, booleanFlags, valueFlags, booleanFlags_1, booleanFlags_1_1, flag, valueFlags_1, valueFlags_1_1, flag, value, fullCmd;
            var e_1, _a, e_2, _b;
            return logger.__generator(this, function (_c) {
                session = this.sessions.get(sessionId);
                if (!session) {
                    logger.logger.error("Session ".concat(sessionId, " not found"));
                    return [2 /*return*/];
                }
                try {
                    logger.logger.info("\uD83D\uDE80 Generating documentation for session ".concat(sessionId));
                    fakeProjectTsConfigPath = path__namespace.join(this.fakeProjectPath, 'tsconfig.json');
                    cliPath = path__namespace.resolve(process.cwd(), 'bin', 'index-cli.js');
                    // In test mode, check if CLI exists before proceeding
                    if (process.env.NODE_ENV === 'test' && !fs__namespace.existsSync(cliPath)) {
                        logger.logger.warn("CLI not found in test environment: ".concat(cliPath, ". Skipping documentation generation."));
                        session.documentationGenerated = true; // Mark as generated to avoid retries
                        return [2 /*return*/];
                    }
                    cmd = [
                        "node \"".concat(cliPath, "\""),
                        "-p \"".concat(fakeProjectTsConfigPath, "\""),
                        "-d \"".concat(session.documentationDir, "\""),
                        "--templates \"".concat(session.templateDir, "\"")
                    ];
                    config = session.config || {};
                    booleanFlags = [
                        'hideGenerator', 'disableSourceCode', 'disableGraph', 'disableCoverage', 'disablePrivate', 'disableProtected', 'disableInternal',
                        'disableLifeCycleHooks', 'disableConstructors', 'disableRoutesGraph', 'disableSearch', 'disableDependencies', 'disableProperties',
                        'disableDomTree', 'disableTemplateTab', 'disableStyleTab', 'disableMainGraph', 'hideDarkModeToggle', 'minimal', 'serve', 'open', 'watch', 'silent',
                        'coverageTest', 'coverageTestThresholdFail', 'coverageTestShowOnlyFailed'
                    ];
                    valueFlags = [
                        'theme', 'language', 'base', 'customFavicon', 'customLogo', 'assetsFolder', 'extTheme', 'includes', 'includesName', 'output', 'port', 'hostname',
                        'exportFormat', 'coverageTestThreshold', 'coverageMinimumPerFile', 'unitTestCoverage', 'gaID', 'gaSite', 'maxSearchResults', 'toggleMenuItems', 'navTabConfig'
                    ];
                    try {
                        for (booleanFlags_1 = logger.__values(booleanFlags), booleanFlags_1_1 = booleanFlags_1.next(); !booleanFlags_1_1.done; booleanFlags_1_1 = booleanFlags_1.next()) {
                            flag = booleanFlags_1_1.value;
                            if (config[flag] === true) {
                                cmd.push("--".concat(flag));
                            }
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (booleanFlags_1_1 && !booleanFlags_1_1.done && (_a = booleanFlags_1.return)) _a.call(booleanFlags_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    try {
                        for (valueFlags_1 = logger.__values(valueFlags), valueFlags_1_1 = valueFlags_1.next(); !valueFlags_1_1.done; valueFlags_1_1 = valueFlags_1.next()) {
                            flag = valueFlags_1_1.value;
                            if (config[flag] !== undefined && config[flag] !== "") {
                                value = config[flag];
                                // For arrays/objects, stringify
                                if (Array.isArray(value) || typeof value === 'object') {
                                    value = JSON.stringify(value);
                                }
                                cmd.push("--".concat(flag, " \"").concat(value, "\""));
                            }
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (valueFlags_1_1 && !valueFlags_1_1.done && (_b = valueFlags_1.return)) _b.call(valueFlags_1);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                    fullCmd = cmd.join(' ');
                    logger.logger.info("\uD83D\uDE80 Executing CompoDoc command: ".concat(fullCmd));
                    // Log the command to a file for debugging
                    require('fs').appendFileSync('server-commands.log', "".concat(new Date().toISOString(), " - ").concat(fullCmd, "\n"));
                    // Execute with proper error handling (inherit stdio to see errors)
                    child_process.execSync(fullCmd, {
                        cwd: process.cwd(),
                        stdio: 'inherit' // Show output/errors instead of hiding them
                    });
                    this.updateSessionActivity(sessionId);
                    logger.logger.info("\u2705 Documentation generated successfully for session ".concat(sessionId));
                }
                catch (error) {
                    logger.logger.error("\u274C Error generating documentation for session ".concat(sessionId, ":"), error);
                }
                return [2 /*return*/];
            });
        });
    };
    TemplatePlaygroundServer.prototype.startSessionCleanup = function () {
        var _this = this;
        // Clean up sessions older than 1 hour every 10 minutes
        this.cleanupInterval = setInterval(function () {
            var e_3, _a;
            var cutoffTime = Date.now() - (60 * 60 * 1000); // 1 hour ago
            try {
                for (var _b = logger.__values(_this.sessions.entries()), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var _d = logger.__read(_c.value, 2), sessionId = _d[0], session = _d[1];
                    if (session.lastActivity < cutoffTime) {
                        _this.cleanupSession(sessionId);
                    }
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_3) throw e_3.error; }
            }
        }, 10 * 60 * 1000); // Every 10 minutes
    };
    TemplatePlaygroundServer.prototype.cleanupSession = function (sessionId) {
        var e_4, _a;
        var session = this.sessions.get(sessionId);
        if (session) {
            try {
                // Remove directories
                if (fs__namespace.existsSync(session.templateDir)) {
                    fs__namespace.removeSync(session.templateDir);
                }
                if (fs__namespace.existsSync(session.documentationDir)) {
                    fs__namespace.removeSync(session.documentationDir);
                }
                // Clear timer if exists
                var timer = this.debounceTimers.get(sessionId);
                if (timer) {
                    clearTimeout(timer);
                    this.debounceTimers.delete(sessionId);
                }
                try {
                    // Remove IP mapping
                    for (var _b = logger.__values(this.ipToSessionId.entries()), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var _d = logger.__read(_c.value, 2), ip = _d[0], id = _d[1];
                        if (id === sessionId) {
                            this.ipToSessionId.delete(ip);
                            break;
                        }
                    }
                }
                catch (e_4_1) { e_4 = { error: e_4_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_4) throw e_4.error; }
                }
                this.sessions.delete(sessionId);
                logger.logger.info("\uD83E\uDDF9 Cleaned up session: ".concat(sessionId));
            }
            catch (error) {
                logger.logger.error("Error cleaning up session ".concat(sessionId, ":"), error);
            }
        }
    };
    TemplatePlaygroundServer.prototype.initializeHandlebars = function () {
        this.handlebars = require('handlebars');
        this.registerHandlebarsHelpers(this.handlebars, {});
    };
    TemplatePlaygroundServer.prototype.registerAvailablePartials = function () {
        return logger.__awaiter(this, void 0, void 0, function () {
            var partialsDir, partialFiles, partialFiles_1, partialFiles_1_1, file, partialName, partialPath, partialContent;
            var e_5, _a;
            return logger.__generator(this, function (_b) {
                try {
                    partialsDir = path__namespace.join(process.cwd(), 'dist/templates/partials');
                    logger.logger.info("\uD83D\uDD0D Looking for partials in: ".concat(partialsDir));
                    logger.logger.info("\uD83D\uDD0D Partials directory exists: ".concat(fs__namespace.existsSync(partialsDir)));
                    if (fs__namespace.existsSync(partialsDir)) {
                        partialFiles = fs__namespace.readdirSync(partialsDir).filter(function (file) { return file.endsWith('.hbs'); });
                        logger.logger.info("\uD83D\uDCC1 Found ".concat(partialFiles.length, " partial files: ").concat(JSON.stringify(partialFiles)));
                        try {
                            for (partialFiles_1 = logger.__values(partialFiles), partialFiles_1_1 = partialFiles_1.next(); !partialFiles_1_1.done; partialFiles_1_1 = partialFiles_1.next()) {
                                file = partialFiles_1_1.value;
                                partialName = file.replace('.hbs', '');
                                partialPath = path__namespace.join(partialsDir, file);
                                partialContent = fs__namespace.readFileSync(partialPath, 'utf8');
                                // Register the partial
                                this.handlebars.registerPartial(partialName, partialContent);
                                logger.logger.info("\u2705 Registered partial: ".concat(partialName));
                            }
                        }
                        catch (e_5_1) { e_5 = { error: e_5_1 }; }
                        finally {
                            try {
                                if (partialFiles_1_1 && !partialFiles_1_1.done && (_a = partialFiles_1.return)) _a.call(partialFiles_1);
                            }
                            finally { if (e_5) throw e_5.error; }
                        }
                    }
                    else {
                        logger.logger.warn("\u26A0\uFE0F Partials directory not found at: ".concat(partialsDir));
                    }
                }
                catch (error) {
                    logger.logger.error("\u274C Error registering partials:", error);
                }
                return [2 /*return*/];
            });
        });
    };
    TemplatePlaygroundServer.prototype.setupMiddleware = function () {
        // Add request logging for debugging
        this.app.use(function (req, res, next) {
            logger.logger.info("\uD83D\uDD0D REQUEST: ".concat(req.method, " ").concat(req.url, " - User-Agent: ").concat(req.get('User-Agent') || 'unknown'));
            next();
        });
        // Enable CORS for development
        this.app.use(function (req, res, next) {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            if (req.method === 'OPTIONS') {
                res.sendStatus(200);
            }
            else {
                next();
            }
        });
        // Serve Compodoc resources at root level for relative path compatibility
        // Try dist/resources first (production), then src/resources (development/testing)
        var compodocResourcesPathDist = path__namespace.join(process.cwd(), 'dist/resources');
        var compodocResourcesPathSrc = path__namespace.join(process.cwd(), 'src/resources');
        var compodocResourcesPath = fs__namespace.existsSync(compodocResourcesPathDist) ? compodocResourcesPathDist : compodocResourcesPathSrc;
        logger.logger.info("\uD83D\uDCC1 Setting up root-level static files from: ".concat(compodocResourcesPath));
        logger.logger.info("\uD83D\uDCC1 Compodoc resources path exists: ".concat(fs__namespace.existsSync(compodocResourcesPath)));
        // Serve styles, js, images, and other resources at root level
        this.app.use('/styles', express.static(path__namespace.join(compodocResourcesPath, 'styles')));
        this.app.use('/js', express.static(path__namespace.join(compodocResourcesPath, 'js')));
        this.app.use('/images', express.static(path__namespace.join(compodocResourcesPath, 'images')));
        this.app.use('/fonts', express.static(path__namespace.join(compodocResourcesPath, 'fonts')));
        // Serve Compodoc resources under /resources path as well (for backward compatibility)
        this.app.use('/resources', express.static(compodocResourcesPath));
        // Serve static files from template playground directory (index.html, app.js)
        // Try dist/resources first (production), then src/resources (development/testing)
        var playgroundStaticPathDist = path__namespace.join(process.cwd(), 'dist/resources/template-playground-app');
        var playgroundStaticPathSrc = path__namespace.join(process.cwd(), 'src/resources/template-playground-app');
        var playgroundStaticPath = fs__namespace.existsSync(playgroundStaticPathDist) ? playgroundStaticPathDist : playgroundStaticPathSrc;
        logger.logger.info("\uD83D\uDCC1 Setting up playground static files from: ".concat(playgroundStaticPath));
        logger.logger.info("\uD83D\uDCC1 Playground static path exists: ".concat(fs__namespace.existsSync(playgroundStaticPath)));
        this.app.use(express.static(playgroundStaticPath));
        // Parse JSON bodies and form data
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    };
    TemplatePlaygroundServer.prototype.setupRoutes = function () {
        var _this = this;
        // API route to get available templates
        this.app.get('/api/templates', this.getTemplates.bind(this));
        // API route to get template content
        this.app.get('/api/templates/:templateName', this.getTemplate.bind(this));
        // API route to get example data
        this.app.get('/api/example-data/:dataType', this.getExampleData.bind(this));
        // API route to render template with custom data
        this.app.post('/api/render', this.renderTemplate.bind(this));
        // API route to render complete page with template
        this.app.post('/api/render-page', this.renderCompletePage.bind(this));
        // API route to generate documentation with CompoDoc CLI
        this.app.post('/api/generate-docs', this.generateDocs.bind(this));
        // API route to download template package
        this.app.post('/api/download-template', this.downloadTemplatePackage.bind(this));
        // API route to download template ZIP (server-side creation)
        this.app.post('/api/session/:sessionId/download-zip', this.downloadSessionTemplateZip.bind(this));
        this.app.post('/api/session/:sessionId/download-all-templates', this.downloadAllSessionTemplates.bind(this));
        this.app.get('/api/session/:sessionId/download/all', this.downloadAllSessionTemplates.bind(this)); // Alias for compatibility
        // Session management API routes
        this.app.post('/api/session', this.createSessionAPI.bind(this));
        this.app.post('/api/session/create', this.createSessionAPI.bind(this));
        this.app.get('/api/session/:sessionId/templates', this.getSessionTemplates.bind(this));
        this.app.get('/api/session/:sessionId/template/*', this.getSessionTemplate.bind(this));
        this.app.post('/api/session/:sessionId/template/*', this.saveSessionTemplate.bind(this));
        this.app.get('/api/session/:sessionId/template-data/*', this.getSessionTemplateData.bind(this));
        this.app.post('/api/session/:sessionId/generate-docs', this.generateSessionDocs.bind(this));
        this.app.post('/api/session/:sessionId/generate', this.generateSessionDocs.bind(this)); // Alias for compatibility
        this.app.get('/api/session/:sessionId/config', this.getSessionConfig.bind(this));
        this.app.post('/api/session/:sessionId/config', this.updateSessionConfig.bind(this));
        // Serve session-specific generated documentation
        this.app.use('/api/session/:sessionId/docs', this.serveSessionDocs.bind(this));
        // Serve session-specific generated documentation at the expected URL pattern
        // These routes MUST come before the catch-all route
        this.app.get('/docs/:sessionId/index.html', function (req, res) {
            logger.logger.info("\uD83D\uDD0D Docs index route hit: /docs/".concat(req.params.sessionId, "/index.html"));
            var sessionId = req.params.sessionId;
            var session = _this.sessions.get(sessionId);
            if (!session) {
                logger.logger.error("\u274C Session not found: ".concat(sessionId));
                res.status(404).json({ success: false, message: 'Session not found' });
                return;
            }
            _this.updateSessionActivity(sessionId);
            var fullPath = path__namespace.join(session.documentationDir, 'index.html');
            logger.logger.info("\uD83D\uDCC2 Looking for file: ".concat(fullPath));
            if (fs__namespace.existsSync(fullPath)) {
                logger.logger.info("\u2705 Serving file: ".concat(fullPath));
                res.sendFile(fullPath);
            }
            else {
                logger.logger.error("\u274C File not found: ".concat(fullPath));
                res.status(404).send('Documentation file not found');
            }
        });
        // Serve any file within session documentation
        this.app.get('/docs/:sessionId/*', function (req, res) {
            logger.logger.info("\uD83D\uDD0D Docs wildcard route hit: /docs/".concat(req.params.sessionId, "/* - File: ").concat(req.params[0]));
            var sessionId = req.params.sessionId;
            var session = _this.sessions.get(sessionId);
            if (!session) {
                logger.logger.error("\u274C Session not found: ".concat(sessionId));
                res.status(404).json({ success: false, message: 'Session not found' });
                return;
            }
            _this.updateSessionActivity(sessionId);
            // Get the file path after /docs/{sessionId}/
            var filePath = req.params[0] || 'index.html';
            var fullPath = path__namespace.join(session.documentationDir, filePath);
            logger.logger.info("\uD83D\uDCC2 Looking for file: ".concat(fullPath));
            if (fs__namespace.existsSync(fullPath)) {
                logger.logger.info("\u2705 Serving file: ".concat(fullPath));
                res.sendFile(fullPath);
            }
            else {
                logger.logger.error("\u274C File not found: ".concat(fullPath));
                res.status(404).send('Documentation file not found');
            }
        });
        // Handle direct access to session documentation root (index.html)
        this.app.get('/docs/:sessionId', function (req, res) {
            logger.logger.info("\uD83D\uDD0D Docs root route hit: /docs/".concat(req.params.sessionId));
            var sessionId = req.params.sessionId;
            var session = _this.sessions.get(sessionId);
            if (!session) {
                logger.logger.error("\u274C Session not found: ".concat(sessionId));
                res.status(404).json({ success: false, message: 'Session not found' });
                return;
            }
            _this.updateSessionActivity(sessionId);
            var fullPath = path__namespace.join(session.documentationDir, 'index.html');
            logger.logger.info("\uD83D\uDCC2 Looking for file: ".concat(fullPath));
            if (fs__namespace.existsSync(fullPath)) {
                logger.logger.info("\u2705 Serving file: ".concat(fullPath));
                res.sendFile(fullPath);
            }
            else {
                logger.logger.error("\u274C File not found: ".concat(fullPath));
                res.status(404).send('Documentation file not found');
            }
        });
        // Serve generated documentation files (legacy) - MUST come after session-specific routes
        // TEMPORARILY COMMENTED OUT TO TEST SESSION ROUTES
        // this.app.use('/docs', express.static(this.fakeProjectPath)); // Serve generated docs from playground-demo
        // Serve the main playground app for root path only
        this.app.get('/', function (req, res) {
            // Try dist/resources first (production), then src/resources (development/testing)
            var indexPathDist = path__namespace.join(process.cwd(), 'dist/resources/template-playground-app/index.html');
            var indexPathSrc = path__namespace.join(process.cwd(), 'src/resources/template-playground-app/index.html');
            var indexPath = fs__namespace.existsSync(indexPathDist) ? indexPathDist : indexPathSrc;
            if (fs__namespace.existsSync(indexPath)) {
                res.sendFile(indexPath);
            }
            else {
                res.status(404).send('Template Playground not built. Please run the build process.');
            }
        });
        // Handle any remaining non-API routes by serving the main app (for SPA routing)
        this.app.get(/^(?!\/api|\/resources|\/docs).*/, function (req, res) {
            logger.logger.warn("\u26A0\uFE0F CATCH-ALL ROUTE HIT: ".concat(req.method, " ").concat(req.url));
            // Try dist/resources first (production), then src/resources (development/testing)
            var indexPathDist = path__namespace.join(process.cwd(), 'dist/resources/template-playground-app/index.html');
            var indexPathSrc = path__namespace.join(process.cwd(), 'src/resources/template-playground-app/index.html');
            var indexPath = fs__namespace.existsSync(indexPathDist) ? indexPathDist : indexPathSrc;
            if (fs__namespace.existsSync(indexPath)) {
                res.sendFile(indexPath);
            }
            else {
                res.status(404).send('Template Playground not built. Please run the build process.');
            }
        });
    };
    TemplatePlaygroundServer.prototype.getTemplates = function (req, res) {
        return logger.__awaiter(this, void 0, void 0, function () {
            var templatesDir_1, files, templates, error_2;
            return logger.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        templatesDir_1 = path__namespace.join(process.cwd(), 'dist/templates/partials');
                        return [4 /*yield*/, fs__namespace.readdir(templatesDir_1)];
                    case 1:
                        files = _a.sent();
                        templates = files
                            .filter(function (file) { return file.endsWith('.hbs'); })
                            .map(function (file) { return ({
                            name: file.replace('.hbs', ''),
                            filename: file,
                            path: path__namespace.join(templatesDir_1, file)
                        }); });
                        res.json(templates);
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        logger.logger.error('Error reading templates:', error_2);
                        res.status(500).json({ error: 'Failed to read templates' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    TemplatePlaygroundServer.prototype.getTemplate = function (req, res) {
        return logger.__awaiter(this, void 0, void 0, function () {
            var templateName, templatePath, content, error_3;
            return logger.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        templateName = req.params.templateName;
                        templatePath = path__namespace.join(process.cwd(), 'dist/templates/partials', "".concat(templateName, ".hbs"));
                        return [4 /*yield*/, fs__namespace.pathExists(templatePath)];
                    case 1:
                        if (!(_a.sent())) {
                            res.status(404).json({ error: 'Template not found' });
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, fs__namespace.readFile(templatePath, 'utf-8')];
                    case 2:
                        content = _a.sent();
                        res.json({
                            name: templateName,
                            content: content,
                            path: templatePath
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        logger.logger.error('Error reading template:', error_3);
                        res.status(500).json({ error: 'Failed to read template' });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    TemplatePlaygroundServer.prototype.getExampleData = function (req, res) {
        return logger.__awaiter(this, void 0, void 0, function () {
            var dataType, _a, EXAMPLE_DATA, TEMPLATE_CONTEXT, wrappedData, error_4;
            var _b;
            return logger.__generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        dataType = req.params.dataType;
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('./example-data-DR3xY3Rr.js'); })];
                    case 1:
                        _a = _c.sent(), EXAMPLE_DATA = _a.EXAMPLE_DATA, TEMPLATE_CONTEXT = _a.TEMPLATE_CONTEXT;
                        if (!EXAMPLE_DATA[dataType]) {
                            res.status(404).json({ error: 'Example data type not found' });
                            return [2 /*return*/];
                        }
                        wrappedData = dataType === 'component' || dataType === 'directive' || dataType === 'pipe' ||
                            dataType === 'guard' || dataType === 'interceptor' || dataType === 'injectable' ||
                            dataType === 'class' || dataType === 'interface' || dataType === 'entity' ? logger.__assign((_b = {}, _b[dataType] = EXAMPLE_DATA[dataType], _b), EXAMPLE_DATA[dataType]) :
                            EXAMPLE_DATA[dataType];
                        res.json({
                            data: wrappedData,
                            context: TEMPLATE_CONTEXT
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_4 = _c.sent();
                        logger.logger.error('Error getting example data:', error_4);
                        res.status(500).json({ error: 'Failed to get example data' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    TemplatePlaygroundServer.prototype.renderTemplate = function (req, res) {
        return logger.__awaiter(this, void 0, void 0, function () {
            var _a, templateContent, templateData, templateContext, template, rendered;
            return logger.__generator(this, function (_b) {
                try {
                    _a = req.body, templateContent = _a.templateContent, templateData = _a.templateData, templateContext = _a.templateContext;
                    if (!templateContent) {
                        res.status(400).json({ error: 'Template content is required' });
                        return [2 /*return*/];
                    }
                    template = this.handlebars.compile(templateContent);
                    rendered = template(templateData || {});
                    res.json({ rendered: rendered });
                }
                catch (error) {
                    logger.logger.error('Error rendering template:', error);
                    res.status(500).json({
                        error: 'Failed to render template',
                        details: error.message
                    });
                }
                return [2 /*return*/];
            });
        });
    };
    TemplatePlaygroundServer.prototype.renderCompletePage = function (req, res) {
        return logger.__awaiter(this, void 0, void 0, function () {
            var _a, templateContent, templateData, templateContext, renderedContent, completePage;
            return logger.__generator(this, function (_b) {
                try {
                    _a = req.body, templateContent = _a.templateContent, templateData = _a.templateData, templateContext = _a.templateContext;
                    // Handle form data by parsing JSON strings
                    if (typeof templateData === 'string') {
                        try {
                            templateData = JSON.parse(templateData);
                        }
                        catch (e) {
                            templateData = {};
                        }
                    }
                    if (typeof templateContext === 'string') {
                        try {
                            templateContext = JSON.parse(templateContext);
                        }
                        catch (e) {
                            templateContext = {};
                        }
                    }
                    if (!templateContent) {
                        res.status(400).json({ error: 'Template content is required' });
                        return [2 /*return*/];
                    }
                    renderedContent = this.generateCompodocHtml(templateData || {});
                    completePage = "<!doctype html>\n<html class=\"no-js\" lang=\"\">\n    <head>\n        <meta charset=\"utf-8\">\n        <meta http-equiv=\"x-ua-compatible\" content=\"ie=edge\">\n        <title>Template Preview - Compodoc</title>\n        <meta name=\"description\" content=\"\">\n        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n\n        <link rel=\"icon\" type=\"image/x-icon\" href=\"/resources/images/favicon.ico\">\n        <link rel=\"stylesheet\" href=\"/resources/styles/bootstrap.min.css\">\n        <link rel=\"stylesheet\" href=\"/resources/styles/compodoc.css\">\n        <link rel=\"stylesheet\" href=\"/resources/styles/prism.css\">\n        <link rel=\"stylesheet\" href=\"/resources/styles/dark.css\">\n        <link rel=\"stylesheet\" href=\"/resources/styles/style.css\">\n    </head>\n    <body>\n        <script>\n            // Blocking script to avoid flickering dark mode\n            var useDark = window.matchMedia('(prefers-color-scheme: dark)');\n            var darkModeState = useDark.matches;\n            var darkModeStateLocal = localStorage.getItem('compodoc_darkmode-state');\n            if (darkModeStateLocal) {\n                darkModeState = darkModeStateLocal === 'true';\n            }\n            if (darkModeState) {\n                document.body.classList.add('dark');\n            }\n        </script>\n\n        <div class=\"container-fluid main\">\n            <!-- START CONTENT -->\n            <div class=\"content component\">\n                <div class=\"content-data\">\n                    ".concat(renderedContent, "\n                </div>\n            </div>\n            <!-- END CONTENT -->\n        </div>\n\n        <script>\n            var COMPODOC_CURRENT_PAGE_DEPTH = 0;\n            var COMPODOC_CURRENT_PAGE_CONTEXT = 'component';\n            var COMPODOC_CURRENT_PAGE_URL = 'component.html';\n        </script>\n\n        <script src=\"/resources/js/libs/bootstrap-native.js\"></script>\n        <script src=\"/resources/js/libs/prism.js\"></script>\n        <script src=\"/resources/js/compodoc.js\"></script>\n        <script src=\"/resources/js/tabs.js\"></script>\n        <script src=\"/resources/js/sourceCode.js\"></script>\n    </body>\n</html>");
                    res.setHeader('Content-Type', 'text/html');
                    res.send(completePage);
                }
                catch (error) {
                    logger.logger.error('Error rendering complete page:', error);
                    res.status(500).json({
                        error: 'Failed to render complete page',
                        details: error.message
                    });
                }
                return [2 /*return*/];
            });
        });
    };
    TemplatePlaygroundServer.prototype.generateDocs = function (req, res) {
        return logger.__awaiter(this, void 0, void 0, function () {
            var _a, customTemplateContent, mockData, clientIP, session, sessionId, templatePath, error_5;
            return logger.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        _a = req.body, customTemplateContent = _a.customTemplateContent, mockData = _a.mockData;
                        // Update mock data if provided
                        if (mockData) {
                            // This part of the logic needs to be adapted to work with the new session-based system
                            // For now, we'll just log that it's not directly applicable here
                            logger.logger.warn('mockData parameter is not directly applicable in this session-based system. It will be ignored.');
                        }
                        clientIP = this.getClientIP(req);
                        session = this.createOrGetSessionByIP(clientIP);
                        sessionId = session.id;
                        if (!(customTemplateContent && req.body.templatePath)) return [3 /*break*/, 2];
                        templatePath = path__namespace.join(session.templateDir, req.body.templatePath);
                        return [4 /*yield*/, fs__namespace.writeFile(templatePath, customTemplateContent, 'utf8')];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2:
                        // Generate documentation for the new session
                        this.generateDocumentation(sessionId, true); // Use debounce
                        res.json({ success: true, message: 'Documentation generation initiated for a new session', sessionId: sessionId });
                        return [3 /*break*/, 4];
                    case 3:
                        error_5 = _b.sent();
                        logger.logger.error('Error generating documentation:', error_5);
                        res.status(500).json({
                            error: 'Failed to generate documentation',
                            details: error_5.message
                        });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    TemplatePlaygroundServer.prototype.registerHandlebarsHelpers = function (Handlebars, context) {
        // Register translation helper (matches Compodoc's i18n helper pattern)
        Handlebars.registerHelper('t', function () {
            console.log('T HELPER CALLED');
            var key = arguments[0];
            var translations = {
                'components': 'Components',
                'modules': 'Modules',
                'interfaces': 'Interfaces',
                'classes': 'Classes',
                'injectables': 'Injectables',
                'pipes': 'Pipes',
                'directives': 'Directives',
                'guards': 'Guards',
                'interceptors': 'Interceptors',
                'entities': 'Entities',
                'controllers': 'Controllers',
                'info': 'Info',
                'readme': 'Readme',
                'source': 'Source',
                'template': 'Template',
                'styles': 'Styles',
                'dom-tree': 'DOM Tree',
                'file': 'File',
                'description': 'Description',
                'implements': 'Implements',
                'metadata': 'Metadata',
                'index': 'Index',
                'methods': 'Methods',
                'properties': 'Properties'
            };
            return translations[key] || key;
        });
        // Register relative URL helper
        Handlebars.registerHelper('relativeURL', function (depth) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var depthValue = typeof depth === 'number' ? depth : (context.depth || 0);
            var baseUrl = '../'.repeat(depthValue);
            var pathArgs = args.slice(0, -1); // Remove Handlebars options object
            return baseUrl + pathArgs.join('/');
        });
        // Register comparison helper (matches Compodoc's CompareHelper implementation)
        Handlebars.registerHelper('compare', function () {
            var context = this;
            var a = arguments[0];
            var operator = arguments[1];
            var b = arguments[2];
            var options = arguments[3];
            if (arguments.length < 4) {
                throw new Error('handlebars Helper {{compare}} expects 4 arguments');
            }
            var result = false;
            switch (operator) {
                case 'indexof':
                    result = b.indexOf(a) !== -1;
                    break;
                case '===':
                    result = a === b;
                    break;
                case '!==':
                    result = a !== b;
                    break;
                case '>':
                    result = a > b;
                    break;
                case '<':
                    result = a < b;
                    break;
                case '>=':
                    result = a >= b;
                    break;
                case '<=':
                    result = a <= b;
                    break;
                case '==':
                    result = a == b;
                    break;
                case '!=':
                    result = a != b;
                    break;
                default:
                    throw new Error('helper {{compare}}: invalid operator: `' + operator + '`');
            }
            if (result === false) {
                return options.inverse(context);
            }
            return options.fn(context);
        });
        // Register tab helpers (matches Compodoc's IsTabEnabledHelper and IsInitialTabHelper)
        Handlebars.registerHelper('isTabEnabled', function () {
            var context = this;
            var navTabs = arguments[0];
            var tabId = arguments[1];
            var options = arguments[2];
            var isEnabled = navTabs && navTabs.some(function (tab) { return tab.id === tabId; });
            if (isEnabled) {
                return options.fn(context);
            }
            else {
                return options.inverse(context);
            }
        });
        Handlebars.registerHelper('isInitialTab', function () {
            var navTabs = arguments[0];
            var tabId = arguments[1];
            var isInitial = navTabs && navTabs.length > 0 && navTabs[0].id === tabId;
            if (isInitial) {
                return 'active in';
            }
            return '';
        });
        // Register utility helpers
        Handlebars.registerHelper('orLength', function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var options = args.pop();
            var hasLength = args.some(function (arg) { return arg && (Array.isArray(arg) ? arg.length > 0 : arg); });
            if (hasLength) {
                return options.fn(this);
            }
            else {
                return options.inverse(this);
            }
        });
        Handlebars.registerHelper('breakComma', function (array) {
            if (Array.isArray(array)) {
                return array.join(', ');
            }
            return array;
        });
        Handlebars.registerHelper('parseDescription', function (description, depth) {
            // Simple markdown parsing - just return as HTML for now
            return new Handlebars.SafeString(description || '');
        });
        Handlebars.registerHelper('escapeSimpleQuote', function (text) {
            if (typeof text === 'string') {
                return text.replace(/'/g, "\\'");
            }
            return text;
        });
        // Register JSDoc helper
        Handlebars.registerHelper('jsdoc-code-example', function (jsdoctags, options) {
            return options.fn({ tags: jsdoctags || [] });
        });
        // Register link-type helper as a simple partial
        Handlebars.registerHelper('link-type', function (type, options) {
            if (type && type.href) {
                return new Handlebars.SafeString("<a href=\"".concat(type.href, "\" target=\"").concat(type.target || '_self', "\">").concat(type.raw || type, "</a>"));
            }
            return type;
        });
        // Register built-in block helpers
        Handlebars.registerHelper('each', Handlebars.helpers.each);
        Handlebars.registerHelper('if', Handlebars.helpers.if);
        Handlebars.registerHelper('unless', Handlebars.helpers.unless);
        Handlebars.registerHelper('with', Handlebars.helpers.with);
        // Register common partials used in templates
        Handlebars.registerPartial('component-detail', "\n            <p class=\"comment\">\n                <h3>{{t \"file\"}}</h3>\n            </p>\n            <p class=\"comment\">\n                <code>{{component.file}}</code>\n            </p>\n\n            {{#if component.description}}\n                <p class=\"comment\">\n                    <h3>{{t \"description\"}}</h3>\n                </p>\n                <p class=\"comment\">\n                    {{{parseDescription component.description depth}}}\n                </p>\n            {{/if}}\n\n            {{#if component.implements}}\n                <p class=\"comment\">\n                    <h3>{{t \"implements\"}}</h3>\n                </p>\n                <p class=\"comment\">\n                    {{#each component.implements}}\n                        <code>{{this}}</code>{{#unless @last}}, {{/unless}}\n                    {{/each}}\n                </p>\n            {{/if}}\n\n            <section data-compodoc=\"block-metadata\">\n                <h3>{{t \"metadata\"}}</h3>\n                <table class=\"table table-sm table-hover metadata\">\n                    <tbody>\n                        {{#if component.selector}}\n                        <tr>\n                            <td class=\"col-md-3\">selector</td>\n                            <td class=\"col-md-9\"><code>{{component.selector}}</code></td>\n                        </tr>\n                        {{/if}}\n                        {{#if component.templateUrl}}\n                        <tr>\n                            <td class=\"col-md-3\">templateUrl</td>\n                            <td class=\"col-md-9\"><code>{{component.templateUrl}}</code></td>\n                        </tr>\n                        {{/if}}\n                        {{#if component.styleUrls}}\n                        <tr>\n                            <td class=\"col-md-3\">styleUrls</td>\n                            <td class=\"col-md-9\"><code>{{breakComma component.styleUrls}}</code></td>\n                        </tr>\n                        {{/if}}\n                    </tbody>\n                </table>\n            </section>\n\n            {{#orLength component.properties component.methods component.inputs component.outputs}}\n                <section data-compodoc=\"block-index\">\n                    <h3 id=\"index\">{{t \"index\"}}</h3>\n                    <table class=\"table table-sm table-bordered index-table\">\n                        <tbody>\n                            {{#if component.methods}}\n                            <tr>\n                                <td class=\"col-md-4\">\n                                    <h6><b>{{t \"methods\"}}</b></h6>\n                                </td>\n                            </tr>\n                            <tr>\n                                <td class=\"col-md-4\">\n                                    <ul class=\"index-list\">\n                                        {{#each component.methods}}\n                                        <li><a href=\"#{{name}}\">{{name}}</a></li>\n                                        {{/each}}\n                                    </ul>\n                                </td>\n                            </tr>\n                            {{/if}}\n                            {{#if component.properties}}\n                            <tr>\n                                <td class=\"col-md-4\">\n                                    <h6><b>{{t \"properties\"}}</b></h6>\n                                </td>\n                            </tr>\n                            <tr>\n                                <td class=\"col-md-4\">\n                                    <ul class=\"index-list\">\n                                        {{#each component.properties}}\n                                        <li><a href=\"#{{name}}\">{{name}}</a></li>\n                                        {{/each}}\n                                    </ul>\n                                </td>\n                            </tr>\n                            {{/if}}\n                        </tbody>\n                    </table>\n                </section>\n            {{/orLength}}\n\n            {{#if component.methods}}\n                <section data-compodoc=\"block-methods\">\n                    <h3 id=\"methods\">{{t \"methods\"}}</h3>\n                    {{#each component.methods}}\n                    <table class=\"table table-sm table-bordered\">\n                        <tbody>\n                            <tr>\n                                <td class=\"col-md-4\">\n                                    <a name=\"{{name}}\"></a>\n                                    <span class=\"name\">\n                                        <span><b>{{name}}</b></span>\n                                        <a href=\"#{{name}}\"><span class=\"icon ion-ios-link\"></span></a>\n                                    </span>\n                                </td>\n                            </tr>\n                            <tr>\n                                <td class=\"col-md-4\">\n                                    <code>{{name}}({{#each args}}{{name}}: {{type}}{{#unless @last}}, {{/unless}}{{/each}})</code>\n                                </td>\n                            </tr>\n                            {{#if description}}\n                            <tr>\n                                <td class=\"col-md-4\">\n                                    <div class=\"io-description\">{{description}}</div>\n                                    <div class=\"io-description\">\n                                        <b>Returns : </b><code>{{type}}</code>\n                                    </div>\n                                </td>\n                            </tr>\n                            {{/if}}\n                        </tbody>\n                    </table>\n                    {{/each}}\n                </section>\n            {{/if}}\n        ");
        Handlebars.registerPartial('index', '<!-- Index partial placeholder -->');
        Handlebars.registerPartial('link-type', '<code>{{type}}</code>');
    };
    TemplatePlaygroundServer.prototype.generateCompodocHtml = function (data) {
        var component = data.component || {};
        var navTabs = data.navTabs || [];
        // Generate navigation tabs
        var tabsHtml = navTabs.map(function (tab, index) {
            var isActive = index === 0;
            var activeClass = isActive ? 'nav-link active' : 'nav-link';
            var labelMap = {
                'info': 'Info',
                'readme': 'Readme',
                'source': 'Source',
                'template': 'Template',
                'styles': 'Styles',
                'dom-tree': 'DOM Tree'
            };
            var label = labelMap[tab.label] || tab.label;
            return "        <li class=\"nav-item\">\n            <a href=\"".concat(tab.href, "\" class=\"").concat(activeClass, "\" role=\"tab\" id=\"").concat(tab.id, "-tab\" data-bs-toggle=\"tab\" data-link=\"").concat(tab['data-link'], "\">").concat(label, "</a>\n        </li>");
        }).join('\n');
        // Generate tab content
        var tabContentHtml = '';
        // Info tab
        if (navTabs.some(function (tab) { return tab.id === 'info'; })) {
            var isActive = navTabs[0].id === 'info';
            var activeClass = isActive ? 'active in' : '';
            tabContentHtml += "    <div class=\"tab-pane fade ".concat(activeClass, "\" id=\"info\">\n        <p class=\"comment\">\n            <h3>File</h3>\n        </p>\n        <p class=\"comment\">\n            <code>").concat(component.file || '', "</code>\n        </p>\n\n        ").concat(component.description ? "\n        <p class=\"comment\">\n            <h3>Description</h3>\n        </p>\n        <p class=\"comment\">\n            <p>".concat(component.description.replace(/\n/g, '</p>\n<p>'), "</p>\n        </p>\n        ") : '', "\n\n        ").concat(component.implements && component.implements.length > 0 ? "\n        <p class=\"comment\">\n            <h3>Implements</h3>\n        </p>\n        <p class=\"comment\">\n            ".concat(component.implements.map(function (impl) { return "<code>".concat(impl, "</code>"); }).join(', '), "\n        </p>\n        ") : '', "\n\n        <section data-compodoc=\"block-metadata\">\n            <h3>Metadata</h3>\n            <table class=\"table table-sm table-hover metadata\">\n                <tbody>\n                    ").concat(component.selector ? "\n                    <tr>\n                        <td class=\"col-md-3\">selector</td>\n                        <td class=\"col-md-9\"><code>".concat(component.selector, "</code></td>\n                    </tr>") : '', "\n                    ").concat(component.templateUrl ? "\n                    <tr>\n                        <td class=\"col-md-3\">templateUrl</td>\n                        <td class=\"col-md-9\"><code>".concat(component.templateUrl, "</code></td>\n                    </tr>") : '', "\n                    ").concat(component.styleUrls && component.styleUrls.length > 0 ? "\n                    <tr>\n                        <td class=\"col-md-3\">styleUrls</td>\n                        <td class=\"col-md-9\"><code>".concat(component.styleUrls.join(', '), "</code></td>\n                    </tr>") : '', "\n                </tbody>\n            </table>\n        </section>\n\n        ").concat(component.methods && component.methods.length > 0 ? "\n        <section data-compodoc=\"block-index\">\n            <h3 id=\"index\">Index</h3>\n            <table class=\"table table-sm table-bordered index-table\">\n                <tbody>\n                    <tr>\n                        <td class=\"col-md-4\">\n                            <h6><b>Methods</b></h6>\n                        </td>\n                    </tr>\n                    <tr>\n                        <td class=\"col-md-4\">\n                            <ul class=\"index-list\">\n                                ".concat(component.methods.map(function (method) { return "<li><a href=\"#".concat(method.name, "\">").concat(method.name, "</a></li>"); }).join('\n                                '), "\n                            </ul>\n                        </td>\n                    </tr>\n                </tbody>\n            </table>\n        </section>\n\n        <section data-compodoc=\"block-methods\">\n            <h3 id=\"methods\">Methods</h3>\n            ").concat(component.methods.map(function (method) { return "\n            <table class=\"table table-sm table-bordered\">\n                <tbody>\n                    <tr>\n                        <td class=\"col-md-4\">\n                            <a name=\"".concat(method.name, "\"></a>\n                            <span class=\"name\">\n                                <span><b>").concat(method.name, "</b></span>\n                                <a href=\"#").concat(method.name, "\"><span class=\"icon ion-ios-link\"></span></a>\n                            </span>\n                        </td>\n                    </tr>\n                    <tr>\n                        <td class=\"col-md-4\">\n                            <code>").concat(method.name, "()</code>\n                        </td>\n                    </tr>\n                    ").concat(method.description ? "\n                    <tr>\n                        <td class=\"col-md-4\">\n                            <div class=\"io-description\">".concat(method.description, "</div>\n                            <div class=\"io-description\">\n                                <b>Returns : </b><code>").concat(method.type || 'void', "</code>\n                            </div>\n                        </td>\n                    </tr>") : '', "\n                </tbody>\n            </table>"); }).join('\n            '), "\n        </section>") : '', "\n    </div>\n");
        }
        // Source tab
        if (navTabs.some(function (tab) { return tab.id === 'source'; })) {
            var isActive = navTabs[0].id === 'source';
            var activeClass = isActive ? 'active in' : '';
            tabContentHtml += "    <div class=\"tab-pane fade ".concat(activeClass, " tab-source-code\" id=\"source\">\n        <pre class=\"line-numbers compodoc-sourcecode\"><code class=\"language-typescript\">").concat(component.sourceCode || '', "</code></pre>\n    </div>\n");
        }
        // Generate complete HTML
        return "<ol class=\"breadcrumb\">\n  <li class=\"breadcrumb-item\">Components</li>\n  <li class=\"breadcrumb-item\">".concat(component.name || '', "</li>\n</ol>\n\n<ul class=\"nav nav-tabs\" role=\"tablist\">\n").concat(tabsHtml, "\n</ul>\n\n<div class=\"tab-content\">\n").concat(tabContentHtml, "</div>");
    };
    TemplatePlaygroundServer.prototype.downloadTemplatePackage = function (req, res) {
        return logger.__awaiter(this, void 0, void 0, function () {
            var _a, templateType, templateContent, templateData, readme, exampleData, zipStructure;
            var _b;
            return logger.__generator(this, function (_c) {
                try {
                    _a = req.body, templateType = _a.templateType, templateContent = _a.templateContent, templateData = _a.templateData;
                    if (!templateType || !templateContent) {
                        res.status(400).json({ error: 'Template type and content are required' });
                        return [2 /*return*/];
                    }
                    readme = "# Custom Compodoc Template\n\nThis package contains your customized Compodoc template for: **".concat(templateType, "**\n\n## Files Included\n\n- `templates/partials/").concat(templateType, ".hbs` - Your modified template\n- `example-data.json` - Sample data structure for testing\n- `README.md` - This file\n\n## How to Use\n\n### Option 1: Replace in existing Compodoc installation\n\n1. Backup your original template file (usually in `node_modules/@compodoc/compodoc/dist/templates/partials/").concat(templateType, ".hbs`)\n2. Replace it with the provided `").concat(templateType, ".hbs` file\n3. Regenerate your documentation with Compodoc\n\n### Option 2: Use with custom template directory\n\n1. Create a custom templates directory in your project:\n   ```\n   mkdir -p custom-templates/partials\n   ```\n\n2. Copy the `").concat(templateType, ".hbs` file to:\n   ```\n   custom-templates/partials/").concat(templateType, ".hbs\n   ```\n\n3. Run Compodoc with the custom template directory:\n   ```\n   compodoc -p tsconfig.json -d documentation --customTemplate custom-templates\n   ```\n\n## Template Variables\n\nThe template has access to these main variables:\n\n- `component` - Component information (name, description, inputs, outputs, etc.)\n- `navTabs` - Navigation tabs configuration\n- `depth` - Current page depth for relative URLs\n- `t` - Translation helper function\n\nFor a complete list of available variables, see the `example-data.json` file.\n\n## Need Help?\n\n- Compodoc Documentation: https://compodoc.app/\n- GitHub Issues: https://github.com/compodoc/compodoc/issues\n\nGenerated by Compodoc Template Playground on ").concat(new Date().toLocaleString(), "\n");
                    exampleData = {
                        template: templateType,
                        description: 'This is sample data that matches the structure used in Compodoc templates',
                        data: templateData || {}
                    };
                    zipStructure = (_b = {},
                        _b["templates/partials/".concat(templateType, ".hbs")] = templateContent,
                        _b['README.md'] = readme,
                        _b['example-data.json'] = JSON.stringify(exampleData, null, 2),
                        _b);
                    res.json({
                        success: true,
                        filename: "compodoc-".concat(templateType, "-template.zip"),
                        files: zipStructure
                    });
                }
                catch (error) {
                    logger.logger.error('Error creating template package:', error);
                    res.status(500).json({
                        error: 'Failed to create template package',
                        details: error.message
                    });
                }
                return [2 /*return*/];
            });
        });
    };
    TemplatePlaygroundServer.prototype.downloadSessionTemplateZip = function (req, res) {
        return logger.__awaiter(this, void 0, void 0, function () {
            var sessionId_1, _a, templatePath_1, templateContent_1, session, templateName_1, fileName_1, error_6;
            var _this = this;
            return logger.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        sessionId_1 = req.params.sessionId;
                        _a = req.body, templatePath_1 = _a.templatePath, templateContent_1 = _a.templateContent;
                        if (!templatePath_1 || !templateContent_1) {
                            res.status(400).json({ error: 'Template path and content are required' });
                            return [2 /*return*/];
                        }
                        session = this.sessions.get(sessionId_1);
                        if (!session) {
                            res.status(404).json({ success: false, message: 'Session not found' });
                            return [2 /*return*/];
                        }
                        this.updateSessionActivity(sessionId_1);
                        templateName_1 = path__namespace.basename(templatePath_1, '.hbs');
                        fileName_1 = "compodoc-".concat(templateName_1, "-template.zip");
                        // Set response headers for file download
                        res.setHeader('Content-Type', 'application/zip');
                        res.setHeader('Content-Disposition', "attachment; filename=\"".concat(fileName_1, "\""));
                        // Create ZIP archive and handle it with proper promise
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                var archive = archiver('zip', {
                                    zlib: { level: 9 } // Maximum compression
                                });
                                // Handle archive events
                                archive.on('error', function (err) {
                                    logger.logger.error('Archive error:', err);
                                    reject(new Error("Failed to create ZIP file: ".concat(err.message)));
                                });
                                archive.on('end', function () {
                                    logger.logger.info("\u2705 Template ZIP created successfully for session ".concat(sessionId_1, ": ").concat(fileName_1));
                                    resolve();
                                });
                                // Pipe archive to response
                                archive.pipe(res);
                                // Add template file to ZIP
                                archive.append(templateContent_1, { name: "templates/partials/".concat(templateName_1, ".hbs") });
                                // Create README content
                                var readme = "# Custom Compodoc Template\n\nThis package contains your customized Compodoc template for: **".concat(templateName_1, "**\n\n## Files Included\n\n- `templates/partials/").concat(templateName_1, ".hbs` - Your modified template\n- `example-data.json` - Sample data structure for testing\n- `README.md` - This file\n\n## How to Use\n\n### Option 1: Replace in existing Compodoc installation\n\n1. Backup your original template file (usually in `node_modules/@compodoc/compodoc/dist/templates/partials/").concat(templateName_1, ".hbs`)\n2. Replace it with the provided `").concat(templateName_1, ".hbs` file\n3. Regenerate your documentation with Compodoc\n\n### Option 2: Use with custom template directory\n\n1. Create a custom templates directory in your project:\n   ```\n   mkdir -p custom-templates/partials\n   ```\n\n2. Copy the `").concat(templateName_1, ".hbs` file to:\n   ```\n   custom-templates/partials/").concat(templateName_1, ".hbs\n   ```\n\n3. Run Compodoc with the custom template directory:\n   ```\n   compodoc -p tsconfig.json -d documentation --customTemplate custom-templates\n   ```\n\n## Template Variables\n\nThe template has access to these main variables:\n\n- `component` - Component information (name, description, inputs, outputs, etc.)\n- `navTabs` - Navigation tabs configuration\n- `depth` - Current page depth for relative URLs\n- `t` - Translation helper function\n\nFor a complete list of available variables, see the `example-data.json` file.\n\n## Need Help?\n\n- Compodoc Documentation: https://compodoc.app/\n- GitHub Issues: https://github.com/compodoc/compodoc/issues\n\nGenerated by Compodoc Template Playground on ").concat(new Date().toLocaleString(), "\n");
                                // Add README to ZIP
                                archive.append(readme, { name: 'README.md' });
                                // Try to get template data for the current session and template
                                _this.getSessionTemplateDataInternal(sessionId_1, templatePath_1)
                                    .then(function (templateDataResponse) {
                                    var exampleData = {
                                        template: templateName_1,
                                        description: 'This is sample data that matches the structure used in Compodoc templates',
                                        data: templateDataResponse || {}
                                    };
                                    archive.append(JSON.stringify(exampleData, null, 2), { name: 'example-data.json' });
                                })
                                    .catch(function (dataError) {
                                    logger.logger.warn('Could not get template data, using basic structure:', dataError);
                                    var basicData = {
                                        template: templateName_1,
                                        description: 'This is sample data that matches the structure used in Compodoc templates',
                                        data: { note: 'Template data could not be loaded' }
                                    };
                                    archive.append(JSON.stringify(basicData, null, 2), { name: 'example-data.json' });
                                })
                                    .finally(function () {
                                    // Finalize the archive after adding all files
                                    archive.finalize();
                                });
                            })];
                    case 1:
                        // Create ZIP archive and handle it with proper promise
                        _b.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_6 = _b.sent();
                        logger.logger.error('Error creating session template ZIP:', error_6);
                        if (!res.headersSent) {
                            res.status(500).json({
                                error: 'Failed to create template ZIP',
                                details: error_6.message
                            });
                        }
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    TemplatePlaygroundServer.prototype.downloadAllSessionTemplates = function (req, res) {
        return logger.__awaiter(this, void 0, void 0, function () {
            var sessionId_2, session_2, fileName_2, zipBuffer, error_7;
            return logger.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        sessionId_2 = req.params.sessionId;
                        session_2 = this.sessions.get(sessionId_2);
                        if (!session_2) {
                            res.status(404).json({ success: false, message: 'Session not found' });
                            return [2 /*return*/];
                        }
                        this.updateSessionActivity(sessionId_2);
                        fileName_2 = "compodoc-templates-".concat(sessionId_2, ".zip");
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                var archive = archiver('zip', {
                                    zlib: { level: 9 } // Maximum compression
                                });
                                var chunks = [];
                                // Handle archive events
                                archive.on('error', function (err) {
                                    logger.logger.error('Archive error:', err);
                                    reject(new Error("Failed to create ZIP file: ".concat(err.message)));
                                });
                                archive.on('data', function (chunk) {
                                    chunks.push(chunk);
                                });
                                archive.on('end', function () {
                                    logger.logger.info("\u2705 All templates ZIP created successfully for session ".concat(sessionId_2, ": ").concat(fileName_2));
                                    var buffer = Buffer.concat(chunks);
                                    resolve(buffer);
                                });
                                // Add all files from the session's template directory
                                // This maintains the same structure as hbs-templates-copy-<hash>
                                archive.directory(session_2.templateDir, false);
                                // Create a comprehensive README
                                var readme = "# Compodoc Template Package\n\nThis package contains all customized Compodoc templates for session: **".concat(sessionId_2, "**\n\n## Structure\n\nThis template package has the same structure as Compodoc's default templates:\n\n- `page.hbs` - Main page template\n- `partials/` - Directory containing all partial templates:\n  - Component templates (`component.hbs`, `directive.hbs`, etc.)\n  - Block templates (`block-*.hbs`)\n  - Layout templates (`menu.hbs`, `index.hbs`, etc.)\n  - Utility templates (`search-*.hbs`, `coverage-*.hbs`, etc.)\n\n## How to Use\n\n### Option 1: Replace entire template directory\n\n1. Backup your original templates directory (usually in `node_modules/@compodoc/compodoc/dist/templates/`)\n2. Replace it with the contents of this ZIP file\n3. Regenerate your documentation with Compodoc\n\n### Option 2: Use with custom template directory\n\n1. Extract this ZIP to a directory in your project (e.g., `custom-templates/`)\n2. Run Compodoc with the custom template directory:\n   ```\n   compodoc -p tsconfig.json -d documentation --customTemplate custom-templates\n   ```\n\n### Option 3: Use specific templates only\n\n1. Extract only the templates you want to customize\n2. Place them in your custom template directory maintaining the same structure\n3. Compodoc will use your custom templates and fall back to defaults for others\n\n## Template Variables\n\nTemplates have access to comprehensive data structures including:\n\n- Component/Directive/Service information\n- Navigation and routing data\n- Documentation metadata\n- Configuration options\n- Helper functions for formatting and navigation\n\n## Need Help?\n\n- Compodoc Documentation: https://compodoc.app/\n- GitHub Issues: https://github.com/compodoc/compodoc/issues\n- Template Documentation: https://compodoc.app/guides/templates.html\n\nGenerated by Compodoc Template Playground on ").concat(new Date().toLocaleString(), "\n");
                                // Add README to ZIP root
                                archive.append(readme, { name: 'README.md' });
                                // Finalize the archive after adding all files
                                archive.finalize();
                            })];
                    case 1:
                        zipBuffer = _a.sent();
                        // Set headers and send buffer response for supertest compatibility
                        res.setHeader('Content-Type', 'application/zip');
                        res.setHeader('Content-Disposition', "attachment; filename=\"".concat(fileName_2, "\""));
                        res.setHeader('Content-Length', zipBuffer.length.toString());
                        // For testing, also add a custom header with the size
                        res.setHeader('X-Content-Size', zipBuffer.length.toString());
                        res.end(zipBuffer, 'binary');
                        return [3 /*break*/, 3];
                    case 2:
                        error_7 = _a.sent();
                        logger.logger.error('Error creating all templates ZIP:', error_7);
                        if (!res.headersSent) {
                            res.status(500).json({
                                error: 'Failed to create all templates ZIP',
                                details: error_7.message
                            });
                        }
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    TemplatePlaygroundServer.prototype.getSessionTemplateDataInternal = function (sessionId, templatePath) {
        return logger.__awaiter(this, void 0, void 0, function () {
            var templateName, data;
            return logger.__generator(this, function (_a) {
                // Internal method to get template data without HTTP request/response
                if (!this.sessions.has(sessionId)) {
                    throw new Error('Session not found');
                }
                this.updateSessionActivity(sessionId);
                templateName = path__namespace.basename(templatePath, '.hbs');
                data = {};
                if (templateName.includes('component')) {
                    data = {
                        name: 'ExampleComponent',
                        description: 'A sample Angular component for demonstration',
                        file: 'src/app/example.component.ts',
                        selector: 'app-example',
                        templateUrl: './example.component.html',
                        styleUrls: ['./example.component.scss'],
                        inputs: [
                            { name: 'title', type: 'string', description: 'Component title' },
                            { name: 'enabled', type: 'boolean', description: 'Whether component is enabled' }
                        ],
                        outputs: [
                            { name: 'clicked', type: 'EventEmitter<void>', description: 'Emitted when clicked' }
                        ]
                    };
                }
                else if (templateName.includes('service') || templateName.includes('injectable')) {
                    data = {
                        name: 'ExampleService',
                        description: 'A sample Angular service for demonstration',
                        file: 'src/app/example.service.ts',
                        methods: [
                            { name: 'getData', returnType: 'Observable<any>', description: 'Gets data from API' },
                            { name: 'saveData', returnType: 'void', description: 'Saves data to storage' }
                        ]
                    };
                }
                else {
                    data = {
                        name: "Example".concat(templateName.charAt(0).toUpperCase() + templateName.slice(1)),
                        description: "A sample ".concat(templateName, " for demonstration"),
                        file: "src/app/example.".concat(templateName, ".ts")
                    };
                }
                return [2 /*return*/, data];
            });
        });
    };
    // Session management API methods
    TemplatePlaygroundServer.prototype.createSessionAPI = function (req, res) {
        return logger.__awaiter(this, void 0, void 0, function () {
            var clientIP, forceNew, session;
            return logger.__generator(this, function (_a) {
                try {
                    clientIP = this.getClientIP(req);
                    forceNew = process.env.NODE_ENV === 'test' || req.query.forceNew === 'true';
                    session = forceNew ? this.createNewSession(clientIP) : this.createOrGetSessionByIP(clientIP);
                    res.json({
                        sessionId: session.id,
                        success: true,
                        message: 'Session created successfully',
                        ip: clientIP
                    });
                }
                catch (error) {
                    logger.logger.error('Error creating session:', error);
                    res.status(500).json({
                        success: false,
                        message: 'Failed to create session',
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
                return [2 /*return*/];
            });
        });
    };
    TemplatePlaygroundServer.prototype.getSessionTemplates = function (req, res) {
        return logger.__awaiter(this, void 0, void 0, function () {
            var sessionId, session, templates_1, partialsDir, mainTemplatePath, partialFiles;
            return logger.__generator(this, function (_a) {
                try {
                    sessionId = req.params.sessionId;
                    session = this.sessions.get(sessionId);
                    if (!session) {
                        res.status(404).json({ success: false, message: 'Session not found' });
                        return [2 /*return*/];
                    }
                    this.updateSessionActivity(sessionId);
                    templates_1 = [];
                    partialsDir = path__namespace.join(session.templateDir, 'partials');
                    mainTemplatePath = path__namespace.join(session.templateDir, 'page.hbs');
                    if (fs__namespace.existsSync(mainTemplatePath)) {
                        templates_1.push({
                            name: 'page.hbs',
                            path: 'page.hbs',
                            type: 'template'
                        });
                    }
                    // Read partials
                    if (fs__namespace.existsSync(partialsDir)) {
                        partialFiles = fs__namespace.readdirSync(partialsDir).filter(function (file) { return file.endsWith('.hbs'); });
                        partialFiles.forEach(function (file) {
                            templates_1.push({
                                name: file,
                                path: "partials/".concat(file),
                                type: 'partial'
                            });
                        });
                    }
                    res.json({ templates: templates_1, success: true });
                }
                catch (error) {
                    logger.logger.error('Error getting session templates:', error);
                    res.status(500).json({
                        success: false,
                        message: 'Failed to get templates',
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
                return [2 /*return*/];
            });
        });
    };
    TemplatePlaygroundServer.prototype.getSessionTemplate = function (req, res) {
        return logger.__awaiter(this, void 0, void 0, function () {
            var sessionId, templateName, session, templatePath, content;
            return logger.__generator(this, function (_a) {
                try {
                    sessionId = req.params.sessionId;
                    templateName = req.params[0];
                    session = this.sessions.get(sessionId);
                    if (!session) {
                        res.status(404).json({ success: false, message: 'Session not found' });
                        return [2 /*return*/];
                    }
                    this.updateSessionActivity(sessionId);
                    templatePath = path__namespace.join(session.templateDir, templateName);
                    if (!fs__namespace.existsSync(templatePath)) {
                        res.status(404).json({ success: false, message: 'Template not found' });
                        return [2 /*return*/];
                    }
                    content = fs__namespace.readFileSync(templatePath, 'utf8');
                    res.json({
                        content: content,
                        success: true,
                        templateName: templateName,
                        path: templateName
                    });
                }
                catch (error) {
                    logger.logger.error('Error getting session template:', error);
                    res.status(500).json({
                        success: false,
                        message: 'Failed to get template',
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
                return [2 /*return*/];
            });
        });
    };
    TemplatePlaygroundServer.prototype.saveSessionTemplate = function (req, res) {
        return logger.__awaiter(this, void 0, void 0, function () {
            var sessionId, templateName, content, session, templatePath;
            return logger.__generator(this, function (_a) {
                try {
                    sessionId = req.params.sessionId;
                    templateName = req.params[0];
                    content = req.body.content;
                    session = this.sessions.get(sessionId);
                    // Validate required parameters
                    if (!content || typeof content !== 'string') {
                        res.status(400).json({
                            success: false,
                            message: 'Content is required and must be a string'
                        });
                        return [2 /*return*/];
                    }
                    if (!templateName) {
                        res.status(400).json({
                            success: false,
                            message: 'Template name is required'
                        });
                        return [2 /*return*/];
                    }
                    if (!session) {
                        res.status(404).json({ success: false, message: 'Session not found' });
                        return [2 /*return*/];
                    }
                    this.updateSessionActivity(sessionId);
                    templatePath = path__namespace.join(session.templateDir, templateName);
                    // Ensure directory exists
                    fs__namespace.ensureDirSync(path__namespace.dirname(templatePath));
                    // Save the template content
                    fs__namespace.writeFileSync(templatePath, content, 'utf8');
                    // Trigger debounced documentation regeneration
                    this.generateDocumentation(sessionId, true);
                    res.json({
                        success: true,
                        message: 'Template saved successfully',
                        templateName: templateName
                    });
                }
                catch (error) {
                    logger.logger.error('Error saving session template:', error);
                    res.status(500).json({
                        success: false,
                        message: 'Failed to save template',
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
                return [2 /*return*/];
            });
        });
    };
    TemplatePlaygroundServer.prototype.getSessionTemplateData = function (req, res) {
        return logger.__awaiter(this, void 0, void 0, function () {
            var sessionId, templatePath, session, templateName, compodocConfig, responseData, additionalContext, templateVariables, commonContext;
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23;
            return logger.__generator(this, function (_24) {
                try {
                    sessionId = req.params.sessionId;
                    templatePath = req.params[0];
                    if (!this.sessions.has(sessionId)) {
                        res.status(404).json({
                            success: false,
                            message: 'Session not found'
                        });
                        return [2 /*return*/];
                    }
                    this.updateSessionActivity(sessionId);
                    session = this.sessions.get(sessionId);
                    templateName = path__namespace.basename(templatePath, '.hbs');
                    compodocConfig = {
                        // Documentation Metadata
                        name: ((_a = session === null || session === void 0 ? void 0 : session.config) === null || _a === void 0 ? void 0 : _a.name) || 'Application documentation',
                        // Paths and Output
                        output: ((_b = session === null || session === void 0 ? void 0 : session.config) === null || _b === void 0 ? void 0 : _b.output) || './documentation/',
                        theme: ((_c = session === null || session === void 0 ? void 0 : session.config) === null || _c === void 0 ? void 0 : _c.theme) || 'gitbook',
                        language: ((_d = session === null || session === void 0 ? void 0 : session.config) === null || _d === void 0 ? void 0 : _d.language) || 'en-US',
                        base: ((_e = session === null || session === void 0 ? void 0 : session.config) === null || _e === void 0 ? void 0 : _e.base) || '/',
                        // Assets and Custom UI
                        customFavicon: ((_f = session === null || session === void 0 ? void 0 : session.config) === null || _f === void 0 ? void 0 : _f.customFavicon) || '',
                        customLogo: ((_g = session === null || session === void 0 ? void 0 : session.config) === null || _g === void 0 ? void 0 : _g.customLogo) || '',
                        assetsFolder: ((_h = session === null || session === void 0 ? void 0 : session.config) === null || _h === void 0 ? void 0 : _h.assetsFolder) || '',
                        extTheme: ((_j = session === null || session === void 0 ? void 0 : session.config) === null || _j === void 0 ? void 0 : _j.extTheme) || '',
                        // Feature Toggles - Disable Options
                        disableSourceCode: ((_k = session === null || session === void 0 ? void 0 : session.config) === null || _k === void 0 ? void 0 : _k.disableSourceCode) || false,
                        disableGraph: ((_l = session === null || session === void 0 ? void 0 : session.config) === null || _l === void 0 ? void 0 : _l.disableGraph) || false,
                        disableCoverage: ((_m = session === null || session === void 0 ? void 0 : session.config) === null || _m === void 0 ? void 0 : _m.disableCoverage) || false,
                        disablePrivate: ((_o = session === null || session === void 0 ? void 0 : session.config) === null || _o === void 0 ? void 0 : _o.disablePrivate) || false,
                        disableProtected: ((_p = session === null || session === void 0 ? void 0 : session.config) === null || _p === void 0 ? void 0 : _p.disableProtected) || false,
                        disableInternal: ((_q = session === null || session === void 0 ? void 0 : session.config) === null || _q === void 0 ? void 0 : _q.disableInternal) || false,
                        disableLifeCycleHooks: ((_r = session === null || session === void 0 ? void 0 : session.config) === null || _r === void 0 ? void 0 : _r.disableLifeCycleHooks) || false,
                        disableConstructors: ((_s = session === null || session === void 0 ? void 0 : session.config) === null || _s === void 0 ? void 0 : _s.disableConstructors) || false,
                        disableRoutesGraph: ((_t = session === null || session === void 0 ? void 0 : session.config) === null || _t === void 0 ? void 0 : _t.disableRoutesGraph) || false,
                        disableSearch: ((_u = session === null || session === void 0 ? void 0 : session.config) === null || _u === void 0 ? void 0 : _u.disableSearch) || false,
                        disableDependencies: ((_v = session === null || session === void 0 ? void 0 : session.config) === null || _v === void 0 ? void 0 : _v.disableDependencies) || false,
                        disableProperties: ((_w = session === null || session === void 0 ? void 0 : session.config) === null || _w === void 0 ? void 0 : _w.disableProperties) || false,
                        disableDomTree: ((_x = session === null || session === void 0 ? void 0 : session.config) === null || _x === void 0 ? void 0 : _x.disableDomTree) || false,
                        disableTemplateTab: ((_y = session === null || session === void 0 ? void 0 : session.config) === null || _y === void 0 ? void 0 : _y.disableTemplateTab) || false,
                        disableStyleTab: ((_z = session === null || session === void 0 ? void 0 : session.config) === null || _z === void 0 ? void 0 : _z.disableStyleTab) || false,
                        disableMainGraph: ((_0 = session === null || session === void 0 ? void 0 : session.config) === null || _0 === void 0 ? void 0 : _0.disableMainGraph) || false,
                        // UI Options
                        hideGenerator: ((_1 = session === null || session === void 0 ? void 0 : session.config) === null || _1 === void 0 ? void 0 : _1.hideGenerator) || false,
                        hideDarkModeToggle: ((_2 = session === null || session === void 0 ? void 0 : session.config) === null || _2 === void 0 ? void 0 : _2.hideDarkModeToggle) || false,
                        minimal: ((_3 = session === null || session === void 0 ? void 0 : session.config) === null || _3 === void 0 ? void 0 : _3.minimal) || false,
                        // Additional Content
                        includes: ((_4 = session === null || session === void 0 ? void 0 : session.config) === null || _4 === void 0 ? void 0 : _4.includes) || '',
                        includesName: ((_5 = session === null || session === void 0 ? void 0 : session.config) === null || _5 === void 0 ? void 0 : _5.includesName) || 'Additional documentation',
                        // Serving Options
                        port: ((_6 = session === null || session === void 0 ? void 0 : session.config) === null || _6 === void 0 ? void 0 : _6.port) || 8080,
                        hostname: ((_7 = session === null || session === void 0 ? void 0 : session.config) === null || _7 === void 0 ? void 0 : _7.hostname) || '127.0.0.1',
                        serve: ((_8 = session === null || session === void 0 ? void 0 : session.config) === null || _8 === void 0 ? void 0 : _8.serve) || false,
                        open: ((_9 = session === null || session === void 0 ? void 0 : session.config) === null || _9 === void 0 ? void 0 : _9.open) || false,
                        watch: ((_10 = session === null || session === void 0 ? void 0 : session.config) === null || _10 === void 0 ? void 0 : _10.watch) || false,
                        // Export Options
                        exportFormat: ((_11 = session === null || session === void 0 ? void 0 : session.config) === null || _11 === void 0 ? void 0 : _11.exportFormat) || 'html',
                        // Coverage Options
                        coverageTest: ((_12 = session === null || session === void 0 ? void 0 : session.config) === null || _12 === void 0 ? void 0 : _12.coverageTest) || false,
                        coverageTestThreshold: ((_13 = session === null || session === void 0 ? void 0 : session.config) === null || _13 === void 0 ? void 0 : _13.coverageTestThreshold) || 70,
                        coverageMinimumPerFile: ((_14 = session === null || session === void 0 ? void 0 : session.config) === null || _14 === void 0 ? void 0 : _14.coverageMinimumPerFile) || 0,
                        coverageTestThresholdFail: ((_15 = session === null || session === void 0 ? void 0 : session.config) === null || _15 === void 0 ? void 0 : _15.coverageTestThresholdFail) || true,
                        coverageTestShowOnlyFailed: ((_16 = session === null || session === void 0 ? void 0 : session.config) === null || _16 === void 0 ? void 0 : _16.coverageTestShowOnlyFailed) || false,
                        unitTestCoverage: ((_17 = session === null || session === void 0 ? void 0 : session.config) === null || _17 === void 0 ? void 0 : _17.unitTestCoverage) || '',
                        // Google Analytics
                        gaID: ((_18 = session === null || session === void 0 ? void 0 : session.config) === null || _18 === void 0 ? void 0 : _18.gaID) || '',
                        gaSite: ((_19 = session === null || session === void 0 ? void 0 : session.config) === null || _19 === void 0 ? void 0 : _19.gaSite) || 'auto',
                        // Advanced Options
                        silent: ((_20 = session === null || session === void 0 ? void 0 : session.config) === null || _20 === void 0 ? void 0 : _20.silent) || false,
                        maxSearchResults: ((_21 = session === null || session === void 0 ? void 0 : session.config) === null || _21 === void 0 ? void 0 : _21.maxSearchResults) || 15,
                        // Menu Configuration (as JSON string for editing)
                        toggleMenuItems: JSON.stringify(((_22 = session === null || session === void 0 ? void 0 : session.config) === null || _22 === void 0 ? void 0 : _22.toggleMenuItems) || ['all']),
                        navTabConfig: JSON.stringify(((_23 = session === null || session === void 0 ? void 0 : session.config) === null || _23 === void 0 ? void 0 : _23.navTabConfig) || [])
                    };
                    responseData = compodocConfig;
                    additionalContext = {};
                    templateVariables = void 0;
                    // Determine template type and provide comprehensive realistic data
                    if (templateName.includes('component')) {
                        templateVariables = {
                            // Core component data
                            name: 'UserProfileComponent',
                            description: 'A comprehensive user profile management component that handles user information display and editing capabilities.',
                            file: 'src/app/components/user-profile/user-profile.component.ts',
                            selector: 'app-user-profile',
                            templateUrl: './user-profile.component.html',
                            styleUrls: ['./user-profile.component.scss', './user-profile.theme.scss'],
                            encapsulation: 'ViewEncapsulation.Emulated',
                            changeDetection: 'ChangeDetectionStrategy.OnPush',
                            // Component metadata
                            type: 'component',
                            sourceCode: 'export class UserProfileComponent implements OnInit, OnDestroy { ... }',
                            rawFile: 'user-profile.component.ts',
                            // Template and styles
                            templateData: '<div class="user-profile">\\n  <h2>{{user.name}}</h2>\\n  <p>{{user.email}}</p>\\n</div>',
                            styleUrlsData: [
                                '.user-profile { padding: 20px; }\\n.user-profile h2 { color: #333; }'
                            ],
                            stylesData: [
                                ':host { display: block; margin: 10px; }'
                            ],
                            // Inputs and Outputs
                            inputs: [
                                {
                                    name: 'user',
                                    type: 'User',
                                    description: 'The user object containing profile information',
                                    decorators: ['@Input()'],
                                    optional: false,
                                    defaultValue: null
                                },
                                {
                                    name: 'editable',
                                    type: 'boolean',
                                    description: 'Whether the profile can be edited',
                                    decorators: ['@Input()'],
                                    optional: true,
                                    defaultValue: 'false'
                                },
                                {
                                    name: 'showAvatar',
                                    type: 'boolean',
                                    description: 'Controls avatar visibility',
                                    decorators: ['@Input()'],
                                    optional: true,
                                    defaultValue: 'true'
                                }
                            ],
                            outputs: [
                                {
                                    name: 'userUpdated',
                                    type: 'EventEmitter<User>',
                                    description: 'Emitted when user profile is updated',
                                    decorators: ['@Output()']
                                },
                                {
                                    name: 'avatarClicked',
                                    type: 'EventEmitter<MouseEvent>',
                                    description: 'Emitted when user clicks on avatar',
                                    decorators: ['@Output()']
                                }
                            ],
                            // Methods
                            methods: [
                                {
                                    name: 'ngOnInit',
                                    type: 'void',
                                    description: 'Angular lifecycle hook for component initialization',
                                    args: [],
                                    returnType: 'void',
                                    modifierKind: 'public'
                                },
                                {
                                    name: 'updateProfile',
                                    type: 'Promise<void>',
                                    description: 'Updates the user profile with new information',
                                    args: [
                                        { name: 'userData', type: 'Partial<User>' }
                                    ],
                                    returnType: 'Promise<void>',
                                    modifierKind: 'public'
                                },
                                {
                                    name: 'validateForm',
                                    type: 'boolean',
                                    description: 'Validates the profile form data',
                                    args: [],
                                    returnType: 'boolean',
                                    modifierKind: 'private'
                                }
                            ],
                            // Properties
                            properties: [
                                {
                                    name: 'isLoading',
                                    type: 'boolean',
                                    description: 'Indicates if component is in loading state',
                                    defaultValue: 'false',
                                    modifierKind: 'public'
                                },
                                {
                                    name: 'form',
                                    type: 'FormGroup',
                                    description: 'Reactive form for user profile editing',
                                    modifierKind: 'public'
                                }
                            ],
                            // Host listeners and bindings
                            hostListeners: [
                                {
                                    name: 'click',
                                    args: ['$event'],
                                    description: 'Handles click events on the component'
                                }
                            ],
                            hostBindings: [
                                {
                                    name: 'class.active',
                                    value: 'isActive'
                                }
                            ],
                            // Lifecycle hooks
                            implements: ['OnInit', 'OnDestroy', 'AfterViewInit'],
                            // Dependency injection
                            constructorObj: {
                                name: 'constructor',
                                description: 'Component constructor with dependency injection',
                                args: [
                                    { name: 'userService', type: 'UserService' },
                                    { name: 'router', type: 'Router' },
                                    { name: 'cd', type: 'ChangeDetectorRef' }
                                ]
                            },
                            // Angular-specific metadata
                            providers: ['UserService'],
                            viewProviders: [],
                            queries: [],
                            exportAs: 'userProfile',
                            // Documentation metadata
                            jsdoctags: [
                                {
                                    tagName: { text: 'example' },
                                    comment: '<app-user-profile [user]="currentUser" [editable]="true"></app-user-profile>'
                                }
                            ],
                            // Coverage information (if enabled)
                            coveragePercent: 85,
                            coverageCount: '17/20',
                            status: 'good'
                        };
                        additionalContext = {
                            depth: 1,
                            breadcrumbs: [
                                { name: 'Components', url: '../components.html' },
                                { name: 'UserProfileComponent', url: '#' }
                            ]
                        };
                    }
                    else if (templateName.includes('service') || templateName.includes('injectable')) {
                        templateVariables = {
                            name: 'UserService',
                            description: 'Service responsible for managing user data and authentication operations',
                            file: 'src/app/services/user.service.ts',
                            type: 'injectable',
                            // Injectable metadata
                            providedIn: 'root',
                            decorators: ['@Injectable()'],
                            // Methods
                            methods: [
                                {
                                    name: 'getUser',
                                    type: 'Observable<User>',
                                    description: 'Retrieves user data by ID',
                                    args: [{ name: 'id', type: 'string' }],
                                    returnType: 'Observable<User>',
                                    modifierKind: 'public'
                                },
                                {
                                    name: 'updateUser',
                                    type: 'Observable<User>',
                                    description: 'Updates user information',
                                    args: [
                                        { name: 'id', type: 'string' },
                                        { name: 'userData', type: 'Partial<User>' }
                                    ],
                                    returnType: 'Observable<User>',
                                    modifierKind: 'public'
                                },
                                {
                                    name: 'deleteUser',
                                    type: 'Observable<void>',
                                    description: 'Deletes a user account',
                                    args: [{ name: 'id', type: 'string' }],
                                    returnType: 'Observable<void>',
                                    modifierKind: 'public'
                                }
                            ],
                            // Properties
                            properties: [
                                {
                                    name: 'currentUser$',
                                    type: 'BehaviorSubject<User | null>',
                                    description: 'Observable stream of current user state',
                                    modifierKind: 'private'
                                },
                                {
                                    name: 'apiUrl',
                                    type: 'string',
                                    description: 'Base URL for user API endpoints',
                                    defaultValue: '"/api/users"',
                                    modifierKind: 'private'
                                }
                            ],
                            // Constructor
                            constructorObj: {
                                name: 'constructor',
                                description: 'Service constructor with HTTP client injection',
                                args: [
                                    { name: 'http', type: 'HttpClient' },
                                    { name: 'config', type: 'AppConfig' }
                                ]
                            },
                            // Coverage
                            coveragePercent: 92,
                            coverageCount: '23/25'
                        };
                    }
                    else if (templateName.includes('module')) {
                        templateVariables = {
                            name: 'UserModule',
                            description: 'Feature module containing user-related components and services',
                            file: 'src/app/modules/user/user.module.ts',
                            type: 'module',
                            // Module metadata
                            declarations: [
                                { name: 'UserProfileComponent', type: 'component' },
                                { name: 'UserListComponent', type: 'component' },
                                { name: 'UserCardDirective', type: 'directive' }
                            ],
                            imports: [
                                { name: 'CommonModule', type: 'module' },
                                { name: 'ReactiveFormsModule', type: 'module' },
                                { name: 'RouterModule', type: 'module' }
                            ],
                            exports: [
                                { name: 'UserProfileComponent', type: 'component' },
                                { name: 'UserListComponent', type: 'component' }
                            ],
                            providers: [
                                { name: 'UserService', type: 'service' },
                                { name: 'UserResolver', type: 'resolver' }
                            ],
                            bootstrap: [],
                            schemas: []
                        };
                    }
                    else if (templateName.includes('interface')) {
                        templateVariables = {
                            name: 'User',
                            description: 'Interface defining the structure of user objects',
                            file: 'src/app/interfaces/user.interface.ts',
                            type: 'interface',
                            // Interface properties
                            properties: [
                                {
                                    name: 'id',
                                    type: 'string',
                                    description: 'Unique identifier for the user',
                                    optional: false
                                },
                                {
                                    name: 'email',
                                    type: 'string',
                                    description: 'User email address',
                                    optional: false
                                },
                                {
                                    name: 'name',
                                    type: 'string',
                                    description: 'Full name of the user',
                                    optional: false
                                },
                                {
                                    name: 'avatar',
                                    type: 'string',
                                    description: 'URL to user avatar image',
                                    optional: true
                                },
                                {
                                    name: 'role',
                                    type: 'UserRole',
                                    description: 'User role permissions',
                                    optional: true
                                }
                            ],
                            // Interface methods (if any)
                            methods: [],
                            // Index signatures
                            indexSignatures: []
                        };
                    }
                    else {
                        // Generic data for other templates (directive, pipe, guard, etc.)
                        templateVariables = {
                            name: 'ExampleItem',
                            description: 'A sample item for demonstration purposes',
                            file: 'src/app/example.ts',
                            type: 'class',
                            // Basic properties that most templates would have
                            methods: [
                                {
                                    name: 'ngOnInit',
                                    type: 'void',
                                    description: 'Lifecycle hook',
                                    args: [],
                                    returnType: 'void'
                                }
                            ],
                            properties: [
                                {
                                    name: 'isActive',
                                    type: 'boolean',
                                    description: 'Active state',
                                    defaultValue: 'false'
                                }
                            ]
                        };
                    }
                    commonContext = {
                        // Navigation and UI
                        depth: additionalContext.depth || 0,
                        breadcrumbs: additionalContext.breadcrumbs || [],
                        navTabs: compodocConfig.navTabConfig,
                        // Helper functions available in templates
                        t: function (key) { return "[Translation: ".concat(key, "]"); }, // Simulates i18n function
                        relativeURL: function (url) { return url; }, // URL helper
                        // Project information
                        projectTitle: compodocConfig.documentationMainName || compodocConfig.name || 'Documentation',
                        projectDescription: compodocConfig.documentationMainDescription || 'Documentation description',
                        // Current page context
                        pageType: templateName,
                        pageName: templateVariables.name || 'Unknown',
                        // Feature flags (from config)
                        showSourceCode: !compodocConfig.disableSourceCode,
                        showGraph: !compodocConfig.disableGraph,
                        showCoverage: !compodocConfig.disableCoverage,
                        showPrivateMembers: !compodocConfig.disablePrivate,
                        showProtectedMembers: !compodocConfig.disableProtected,
                        showInternalMembers: !compodocConfig.disableInternal
                    };
                    // Return only the Compodoc configuration options
                    res.json({
                        success: true,
                        categories: {
                            compodocConfig: {
                                title: 'Compodoc Configuration Options',
                                description: 'Edit these configuration options to customize the generated documentation. Changes will automatically regenerate the documentation.',
                                data: compodocConfig
                            }
                        },
                        // Legacy format for backward compatibility
                        data: compodocConfig,
                        context: { config: compodocConfig }
                    });
                }
                catch (error) {
                    logger.logger.error('Error getting session template data:', error);
                    res.status(500).json({
                        success: false,
                        message: 'Failed to get template data',
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
                return [2 /*return*/];
            });
        });
    };
    TemplatePlaygroundServer.prototype.generateSessionDocs = function (req, res) {
        return logger.__awaiter(this, void 0, void 0, function () {
            var sessionId, _a, customTemplateContent, session, templatePath, error_8;
            return logger.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        sessionId = req.params.sessionId;
                        _a = req.body, customTemplateContent = _a.customTemplateContent, _a.mockData;
                        if (!this.sessions.has(sessionId)) {
                            res.status(404).json({
                                success: false,
                                message: 'Session not found'
                            });
                            return [2 /*return*/];
                        }
                        session = this.sessions.get(sessionId);
                        this.updateSessionActivity(sessionId);
                        if (!(customTemplateContent && req.body.templatePath)) return [3 /*break*/, 2];
                        templatePath = path__namespace.join(session.templateDir, req.body.templatePath);
                        return [4 /*yield*/, fs__namespace.writeFile(templatePath, customTemplateContent, 'utf8')];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2:
                        // Generate documentation for this session
                        this.generateDocumentation(sessionId, false); // No debounce for manual generation
                        res.json({
                            success: true,
                            message: 'Documentation generation started',
                            sessionId: sessionId
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        error_8 = _b.sent();
                        logger.logger.error('Error generating session documentation:', error_8);
                        res.status(500).json({
                            success: false,
                            message: 'Failed to generate documentation',
                            error: error_8 instanceof Error ? error_8.message : 'Unknown error'
                        });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    TemplatePlaygroundServer.prototype.getSessionConfig = function (req, res) {
        return logger.__awaiter(this, void 0, void 0, function () {
            var sessionId, session, fullConfig;
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23;
            return logger.__generator(this, function (_24) {
                try {
                    sessionId = req.params.sessionId;
                    session = this.sessions.get(sessionId);
                    if (!session) {
                        res.status(404).json({ success: false, message: 'Session not found' });
                        return [2 /*return*/];
                    }
                    this.updateSessionActivity(sessionId);
                    fullConfig = {
                        // Documentation Metadata
                        name: ((_a = session.config) === null || _a === void 0 ? void 0 : _a.name) || 'Application documentation',
                        // Paths and Output
                        output: ((_b = session.config) === null || _b === void 0 ? void 0 : _b.output) || './documentation/',
                        theme: ((_c = session.config) === null || _c === void 0 ? void 0 : _c.theme) || 'gitbook',
                        language: ((_d = session.config) === null || _d === void 0 ? void 0 : _d.language) || 'en-US',
                        base: ((_e = session.config) === null || _e === void 0 ? void 0 : _e.base) || '/',
                        // Assets and Custom UI
                        customFavicon: ((_f = session.config) === null || _f === void 0 ? void 0 : _f.customFavicon) || '',
                        customLogo: ((_g = session.config) === null || _g === void 0 ? void 0 : _g.customLogo) || '',
                        assetsFolder: ((_h = session.config) === null || _h === void 0 ? void 0 : _h.assetsFolder) || '',
                        extTheme: ((_j = session.config) === null || _j === void 0 ? void 0 : _j.extTheme) || '',
                        // Feature Toggles - Disable Options
                        disableSourceCode: !!((_k = session.config) === null || _k === void 0 ? void 0 : _k.disableSourceCode),
                        disableGraph: !!((_l = session.config) === null || _l === void 0 ? void 0 : _l.disableGraph),
                        disableCoverage: !!((_m = session.config) === null || _m === void 0 ? void 0 : _m.disableCoverage),
                        disablePrivate: !!((_o = session.config) === null || _o === void 0 ? void 0 : _o.disablePrivate),
                        disableProtected: !!((_p = session.config) === null || _p === void 0 ? void 0 : _p.disableProtected),
                        disableInternal: !!((_q = session.config) === null || _q === void 0 ? void 0 : _q.disableInternal),
                        disableLifeCycleHooks: !!((_r = session.config) === null || _r === void 0 ? void 0 : _r.disableLifeCycleHooks),
                        disableConstructors: !!((_s = session.config) === null || _s === void 0 ? void 0 : _s.disableConstructors),
                        disableRoutesGraph: !!((_t = session.config) === null || _t === void 0 ? void 0 : _t.disableRoutesGraph),
                        disableSearch: !!((_u = session.config) === null || _u === void 0 ? void 0 : _u.disableSearch),
                        disableDependencies: !!((_v = session.config) === null || _v === void 0 ? void 0 : _v.disableDependencies),
                        disableProperties: !!((_w = session.config) === null || _w === void 0 ? void 0 : _w.disableProperties),
                        disableDomTree: !!((_x = session.config) === null || _x === void 0 ? void 0 : _x.disableDomTree),
                        disableTemplateTab: !!((_y = session.config) === null || _y === void 0 ? void 0 : _y.disableTemplateTab),
                        disableStyleTab: !!((_z = session.config) === null || _z === void 0 ? void 0 : _z.disableStyleTab),
                        disableMainGraph: !!((_0 = session.config) === null || _0 === void 0 ? void 0 : _0.disableMainGraph),
                        // UI Options
                        hideGenerator: !!((_1 = session.config) === null || _1 === void 0 ? void 0 : _1.hideGenerator),
                        hideDarkModeToggle: !!((_2 = session.config) === null || _2 === void 0 ? void 0 : _2.hideDarkModeToggle),
                        minimal: !!((_3 = session.config) === null || _3 === void 0 ? void 0 : _3.minimal),
                        // Additional Content
                        includes: ((_4 = session.config) === null || _4 === void 0 ? void 0 : _4.includes) || '',
                        includesName: ((_5 = session.config) === null || _5 === void 0 ? void 0 : _5.includesName) || 'Additional documentation',
                        // Serving Options
                        port: ((_6 = session.config) === null || _6 === void 0 ? void 0 : _6.port) || 8080,
                        hostname: ((_7 = session.config) === null || _7 === void 0 ? void 0 : _7.hostname) || '127.0.0.1',
                        serve: !!((_8 = session.config) === null || _8 === void 0 ? void 0 : _8.serve),
                        open: !!((_9 = session.config) === null || _9 === void 0 ? void 0 : _9.open),
                        watch: !!((_10 = session.config) === null || _10 === void 0 ? void 0 : _10.watch),
                        // Export Options
                        exportFormat: ((_11 = session.config) === null || _11 === void 0 ? void 0 : _11.exportFormat) || 'html',
                        // Coverage Options
                        coverageTest: !!((_12 = session.config) === null || _12 === void 0 ? void 0 : _12.coverageTest),
                        coverageTestThreshold: ((_13 = session.config) === null || _13 === void 0 ? void 0 : _13.coverageTestThreshold) || 70,
                        coverageMinimumPerFile: ((_14 = session.config) === null || _14 === void 0 ? void 0 : _14.coverageMinimumPerFile) || 0,
                        coverageTestThresholdFail: !!((_15 = session.config) === null || _15 === void 0 ? void 0 : _15.coverageTestThresholdFail),
                        coverageTestShowOnlyFailed: !!((_16 = session.config) === null || _16 === void 0 ? void 0 : _16.coverageTestShowOnlyFailed),
                        unitTestCoverage: ((_17 = session.config) === null || _17 === void 0 ? void 0 : _17.unitTestCoverage) || '',
                        // Google Analytics
                        gaID: ((_18 = session.config) === null || _18 === void 0 ? void 0 : _18.gaID) || '',
                        gaSite: ((_19 = session.config) === null || _19 === void 0 ? void 0 : _19.gaSite) || 'auto',
                        // Advanced Options
                        silent: !!((_20 = session.config) === null || _20 === void 0 ? void 0 : _20.silent),
                        maxSearchResults: ((_21 = session.config) === null || _21 === void 0 ? void 0 : _21.maxSearchResults) || 15,
                        // Menu Configuration (as JSON string for editing)
                        toggleMenuItems: JSON.stringify(((_22 = session.config) === null || _22 === void 0 ? void 0 : _22.toggleMenuItems) || ['all']),
                        navTabConfig: JSON.stringify(((_23 = session.config) === null || _23 === void 0 ? void 0 : _23.navTabConfig) || [])
                    };
                    res.json({
                        config: fullConfig,
                        success: true
                    });
                }
                catch (error) {
                    logger.logger.error('Error getting session config:', error);
                    res.status(500).json({
                        success: false,
                        message: 'Failed to get config',
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
                return [2 /*return*/];
            });
        });
    };
    TemplatePlaygroundServer.prototype.updateSessionConfig = function (req, res) {
        return logger.__awaiter(this, void 0, void 0, function () {
            var sessionId, config, session;
            return logger.__generator(this, function (_a) {
                try {
                    sessionId = req.params.sessionId;
                    config = req.body.config;
                    session = this.sessions.get(sessionId);
                    if (!session) {
                        res.status(404).json({ success: false, message: 'Session not found' });
                        return [2 /*return*/];
                    }
                    this.updateSessionActivity(sessionId);
                    // Update session config
                    session.config = logger.__assign(logger.__assign({}, session.config), config);
                    // Trigger debounced documentation regeneration with new config
                    this.generateDocumentation(sessionId, true);
                    res.json({
                        success: true,
                        message: 'Configuration updated successfully',
                        config: session.config
                    });
                }
                catch (error) {
                    logger.logger.error('Error updating session config:', error);
                    res.status(500).json({
                        success: false,
                        message: 'Failed to update config',
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
                return [2 /*return*/];
            });
        });
    };
    TemplatePlaygroundServer.prototype.serveSessionDocs = function (req, res, next) {
        try {
            var sessionId = req.params.sessionId;
            var session = this.sessions.get(sessionId);
            if (!session) {
                res.status(404).json({ success: false, message: 'Session not found' });
                return;
            }
            this.updateSessionActivity(sessionId);
            // Remove the session part from the URL to get the file path
            var filePath = req.url.replace(/^\/api\/session\/[^\/]+\/docs/, '');
            var fullPath = path__namespace.join(session.documentationDir, filePath || 'index.html');
            if (fs__namespace.existsSync(fullPath)) {
                res.sendFile(fullPath);
            }
            else {
                res.status(404).send('Documentation file not found');
            }
        }
        catch (error) {
            logger.logger.error('Error serving session docs:', error);
            res.status(500).send('Error serving documentation');
        }
    };
    TemplatePlaygroundServer.prototype.isPortAvailable = function (port) {
        return logger.__awaiter(this, void 0, void 0, function () {
            return logger.__generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) {
                        var server = http__namespace.createServer();
                        server.listen(port, function () {
                            server.close(function () { return resolve(true); });
                        });
                        server.on('error', function () { return resolve(false); });
                    })];
            });
        });
    };
    TemplatePlaygroundServer.prototype.findAvailablePort = function (startPort) {
        return logger.__awaiter(this, void 0, void 0, function () {
            var port;
            return logger.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        port = startPort;
                        _a.label = 1;
                    case 1:
                        if (!(port < startPort + 100)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.isPortAvailable(port)];
                    case 2:
                        if (_a.sent()) {
                            return [2 /*return*/, port];
                        }
                        port++;
                        return [3 /*break*/, 1];
                    case 3: throw new Error("No available port found in range ".concat(startPort, "-").concat(startPort + 99));
                }
            });
        });
    };
    TemplatePlaygroundServer.prototype.start = function () {
        return logger.__awaiter(this, void 0, void 0, function () {
            var originalPort, _a, error_10;
            var _this = this;
            return logger.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, this.isPortAvailable(this.port)];
                    case 1:
                        if (!!(_b.sent())) return [3 /*break*/, 5];
                        originalPort = this.port;
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        _a = this;
                        return [4 /*yield*/, this.findAvailablePort(this.port + 1)];
                    case 3:
                        _a.port = _b.sent();
                        logger.logger.warn("\u26A0\uFE0F  Port ".concat(originalPort, " is in use. Using port ").concat(this.port, " instead."));
                        return [3 /*break*/, 5];
                    case 4:
                        _b.sent();
                        throw new Error("Port ".concat(originalPort, " is in use and no alternative port could be found. Please stop the process using port ").concat(originalPort, " or specify a different port."));
                    case 5:
                        this.server = this.app.listen(this.port, function () {
                            logger.logger.info("\uD83C\uDFA8 Template Playground is running at: http://localhost:".concat(_this.port));
                            logger.logger.info('📝 Use this tool to customize and preview Compodoc templates');
                            logger.logger.info('🔧 Edit templates in the left panel and see live preview on the right');
                            logger.logger.info('💾 Export your customized templates when ready');
                            logger.logger.info('');
                            logger.logger.info('Press Ctrl+C to stop the server');
                        });
                        // Graceful shutdown
                        process.on('SIGTERM', this.stop.bind(this));
                        process.on('SIGINT', this.stop.bind(this));
                        return [3 /*break*/, 7];
                    case 6:
                        error_10 = _b.sent();
                        logger.logger.error('Failed to start Template Playground:', error_10);
                        throw error_10;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    TemplatePlaygroundServer.prototype.stop = function () {
        var _this = this;
        return new Promise(function (resolve) {
            var e_6, _a, e_7, _b, e_8, _c;
            try {
                // Remove signal handlers to prevent memory leaks
                for (var _d = logger.__values(_this.signalHandlers.entries()), _e = _d.next(); !_e.done; _e = _d.next()) {
                    var _f = logger.__read(_e.value, 2), signal = _f[0], handler = _f[1];
                    process.removeListener(signal, handler);
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
                }
                finally { if (e_6) throw e_6.error; }
            }
            _this.signalHandlers.clear();
            // Clear cleanup interval
            if (_this.cleanupInterval) {
                clearInterval(_this.cleanupInterval);
                _this.cleanupInterval = null;
            }
            try {
                // Clear all debounce timers
                for (var _g = logger.__values(_this.debounceTimers.values()), _h = _g.next(); !_h.done; _h = _g.next()) {
                    var timer = _h.value;
                    clearTimeout(timer);
                }
            }
            catch (e_7_1) { e_7 = { error: e_7_1 }; }
            finally {
                try {
                    if (_h && !_h.done && (_b = _g.return)) _b.call(_g);
                }
                finally { if (e_7) throw e_7.error; }
            }
            _this.debounceTimers.clear();
            try {
                // Clean up all sessions
                for (var _j = logger.__values(_this.sessions.keys()), _k = _j.next(); !_k.done; _k = _j.next()) {
                    var sessionId = _k.value;
                    _this.cleanupSession(sessionId);
                }
            }
            catch (e_8_1) { e_8 = { error: e_8_1 }; }
            finally {
                try {
                    if (_k && !_k.done && (_c = _j.return)) _c.call(_j);
                }
                finally { if (e_8) throw e_8.error; }
            }
            if (_this.server) {
                var resolved_1 = false;
                _this.server.close(function (error) {
                    if (!resolved_1) {
                        resolved_1 = true;
                        if (error) {
                            logger.logger.warn('Error closing server:', error);
                        }
                        else {
                            logger.logger.info('Template Playground server stopped');
                        }
                        resolve();
                    }
                });
                // Force close connections if server doesn't close within 2 seconds
                setTimeout(function () {
                    var _a, _b;
                    if (!resolved_1 && _this.server) {
                        resolved_1 = true;
                        logger.logger.warn('Force closing server connections');
                        (_b = (_a = _this.server).closeAllConnections) === null || _b === void 0 ? void 0 : _b.call(_a);
                        resolve();
                    }
                }, 2000);
            }
            else {
                resolve();
            }
        });
    };
    return TemplatePlaygroundServer;
}());

exports.TemplatePlaygroundServer = TemplatePlaygroundServer;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGUtcGxheWdyb3VuZC1zZXJ2ZXIuanMiLCJzb3VyY2VzIjpbIi4uL3NyYy90ZW1wbGF0ZS1wbGF5Z3JvdW5kL3RlbXBsYXRlLXBsYXlncm91bmQtc2VydmVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGV4cHJlc3MgPSByZXF1aXJlKCdleHByZXNzJyk7XHJcbmltcG9ydCB7IFJlcXVlc3QsIFJlc3BvbnNlLCBOZXh0RnVuY3Rpb24sIEFwcGxpY2F0aW9uIH0gZnJvbSAnZXhwcmVzcyc7XHJcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJztcclxuaW1wb3J0ICogYXMgaHR0cCBmcm9tICdodHRwJztcclxuaW1wb3J0ICogYXMgY3J5cHRvIGZyb20gJ2NyeXB0byc7XHJcbmltcG9ydCAqIGFzIG9zIGZyb20gJ29zJztcclxuY29uc3QgYXJjaGl2ZXIgPSByZXF1aXJlKCdhcmNoaXZlcicpO1xyXG5pbXBvcnQgeyBleGVjU3luYyB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xyXG5pbXBvcnQgeyBsb2dnZXIgfSBmcm9tICcuLi91dGlscy9sb2dnZXInO1xyXG5cclxuaW50ZXJmYWNlIFBsYXlncm91bmRTZXNzaW9uIHtcclxuICAgIGlkOiBzdHJpbmc7XHJcbiAgICB0ZW1wbGF0ZURpcjogc3RyaW5nO1xyXG4gICAgZG9jdW1lbnRhdGlvbkRpcjogc3RyaW5nO1xyXG4gICAgbGFzdEFjdGl2aXR5OiBudW1iZXI7XHJcbiAgICBjb25maWc6IENvbXBvRG9jQ29uZmlnO1xyXG4gICAgZG9jdW1lbnRhdGlvbkdlbmVyYXRlZD86IGJvb2xlYW47XHJcbn1cclxuXHJcbmludGVyZmFjZSBDb21wb0RvY0NvbmZpZyB7XHJcbiAgICAvLyBEb2N1bWVudGF0aW9uIE1ldGFkYXRhXHJcbiAgICBuYW1lPzogc3RyaW5nO1xyXG5cclxuICAgIC8vIFBhdGhzIGFuZCBPdXRwdXRcclxuICAgIG91dHB1dD86IHN0cmluZztcclxuICAgIHRoZW1lPzogc3RyaW5nO1xyXG4gICAgbGFuZ3VhZ2U/OiBzdHJpbmc7XHJcbiAgICBiYXNlPzogc3RyaW5nO1xyXG5cclxuICAgIC8vIEFzc2V0cyBhbmQgQ3VzdG9tIFVJXHJcbiAgICBjdXN0b21GYXZpY29uPzogc3RyaW5nO1xyXG4gICAgY3VzdG9tTG9nbz86IHN0cmluZztcclxuICAgIGFzc2V0c0ZvbGRlcj86IHN0cmluZztcclxuICAgIGV4dFRoZW1lPzogc3RyaW5nO1xyXG5cclxuICAgIC8vIEZlYXR1cmUgVG9nZ2xlcyAtIERpc2FibGUgT3B0aW9uc1xyXG4gICAgZGlzYWJsZVNvdXJjZUNvZGU/OiBib29sZWFuO1xyXG4gICAgZGlzYWJsZUdyYXBoPzogYm9vbGVhbjtcclxuICAgIGRpc2FibGVDb3ZlcmFnZT86IGJvb2xlYW47XHJcbiAgICBkaXNhYmxlUHJpdmF0ZT86IGJvb2xlYW47XHJcbiAgICBkaXNhYmxlUHJvdGVjdGVkPzogYm9vbGVhbjtcclxuICAgIGRpc2FibGVJbnRlcm5hbD86IGJvb2xlYW47XHJcbiAgICBkaXNhYmxlTGlmZUN5Y2xlSG9va3M/OiBib29sZWFuO1xyXG4gICAgZGlzYWJsZUNvbnN0cnVjdG9ycz86IGJvb2xlYW47XHJcbiAgICBkaXNhYmxlUm91dGVzR3JhcGg/OiBib29sZWFuO1xyXG4gICAgZGlzYWJsZVNlYXJjaD86IGJvb2xlYW47XHJcbiAgICBkaXNhYmxlRGVwZW5kZW5jaWVzPzogYm9vbGVhbjtcclxuICAgIGRpc2FibGVQcm9wZXJ0aWVzPzogYm9vbGVhbjtcclxuICAgIGRpc2FibGVEb21UcmVlPzogYm9vbGVhbjtcclxuICAgIGRpc2FibGVUZW1wbGF0ZVRhYj86IGJvb2xlYW47XHJcbiAgICBkaXNhYmxlU3R5bGVUYWI/OiBib29sZWFuO1xyXG4gICAgZGlzYWJsZU1haW5HcmFwaD86IGJvb2xlYW47XHJcblxyXG4gICAgLy8gVUkgT3B0aW9uc1xyXG4gICAgaGlkZUdlbmVyYXRvcj86IGJvb2xlYW47XHJcbiAgICBoaWRlRGFya01vZGVUb2dnbGU/OiBib29sZWFuO1xyXG4gICAgbWluaW1hbD86IGJvb2xlYW47XHJcblxyXG4gICAgLy8gQWRkaXRpb25hbCBDb250ZW50XHJcbiAgICBpbmNsdWRlcz86IHN0cmluZztcclxuICAgIGluY2x1ZGVzTmFtZT86IHN0cmluZztcclxuXHJcbiAgICAvLyBTZXJ2aW5nIE9wdGlvbnNcclxuICAgIHBvcnQ/OiBudW1iZXI7XHJcbiAgICBob3N0bmFtZT86IHN0cmluZztcclxuICAgIHNlcnZlPzogYm9vbGVhbjtcclxuICAgIG9wZW4/OiBib29sZWFuO1xyXG4gICAgd2F0Y2g/OiBib29sZWFuO1xyXG5cclxuICAgIC8vIEV4cG9ydCBPcHRpb25zXHJcbiAgICBleHBvcnRGb3JtYXQ/OiBzdHJpbmc7XHJcblxyXG4gICAgLy8gQ292ZXJhZ2UgT3B0aW9uc1xyXG4gICAgY292ZXJhZ2VUZXN0PzogYm9vbGVhbjtcclxuICAgIGNvdmVyYWdlVGVzdFRocmVzaG9sZD86IG51bWJlcjtcclxuICAgIGNvdmVyYWdlTWluaW11bVBlckZpbGU/OiBudW1iZXI7XHJcbiAgICBjb3ZlcmFnZVRlc3RUaHJlc2hvbGRGYWlsPzogYm9vbGVhbjtcclxuICAgIGNvdmVyYWdlVGVzdFNob3dPbmx5RmFpbGVkPzogYm9vbGVhbjtcclxuICAgIHVuaXRUZXN0Q292ZXJhZ2U/OiBzdHJpbmc7XHJcblxyXG4gICAgLy8gR29vZ2xlIEFuYWx5dGljc1xyXG4gICAgZ2FJRD86IHN0cmluZztcclxuICAgIGdhU2l0ZT86IHN0cmluZztcclxuXHJcbiAgICAvLyBBZHZhbmNlZCBPcHRpb25zXHJcbiAgICBzaWxlbnQ/OiBib29sZWFuO1xyXG4gICAgbWF4U2VhcmNoUmVzdWx0cz86IG51bWJlcjtcclxuXHJcbiAgICAvLyBNZW51IENvbmZpZ3VyYXRpb25cclxuICAgIHRvZ2dsZU1lbnVJdGVtcz86IHN0cmluZ1tdIHwgc3RyaW5nO1xyXG4gICAgbmF2VGFiQ29uZmlnPzogYW55W10gfCBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBUZW1wbGF0ZVBsYXlncm91bmRTZXJ2ZXIge1xyXG4gICAgcHJpdmF0ZSBhcHA6IEFwcGxpY2F0aW9uO1xyXG4gICAgcHJpdmF0ZSBzZXJ2ZXI6IGh0dHAuU2VydmVyO1xyXG4gICAgcHJpdmF0ZSBwb3J0OiBudW1iZXI7XHJcbiAgICBwcml2YXRlIGhhbmRsZWJhcnM6IGFueTtcclxuICAgIHByaXZhdGUgc2Vzc2lvbnM6IE1hcDxzdHJpbmcsIFBsYXlncm91bmRTZXNzaW9uPiA9IG5ldyBNYXAoKTtcclxuICAgIHByaXZhdGUgaXBUb1Nlc3Npb25JZDogTWFwPHN0cmluZywgc3RyaW5nPiA9IG5ldyBNYXAoKTtcclxuICAgIHByaXZhdGUgZGVib3VuY2VUaW1lcnM6IE1hcDxzdHJpbmcsIE5vZGVKUy5UaW1lb3V0PiA9IG5ldyBNYXAoKTtcclxuICAgIHByaXZhdGUgZmFrZVByb2plY3RQYXRoOiBzdHJpbmc7XHJcbiAgICBwcml2YXRlIG9yaWdpbmFsVGVtcGxhdGVzUGF0aDogc3RyaW5nO1xyXG4gICAgcHJpdmF0ZSBjbGVhbnVwSW50ZXJ2YWw6IE5vZGVKUy5UaW1lb3V0O1xyXG4gICAgcHJpdmF0ZSBzaWduYWxIYW5kbGVyczogTWFwPHN0cmluZywgKC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkPiA9IG5ldyBNYXAoKTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwb3J0PzogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5wb3J0ID0gcG9ydCB8fCBwYXJzZUludChwcm9jZXNzLmVudi5QTEFZR1JPVU5EX1BPUlQgfHwgcHJvY2Vzcy5lbnYuUE9SVCB8fCAnMzAwMScsIDEwKTtcclxuICAgICAgICB0aGlzLmFwcCA9IGV4cHJlc3MoKTtcclxuICAgICAgICB0aGlzLnNldHVwUGF0aHMoKTtcclxuICAgICAgICB0aGlzLmluaXRpYWxpemVIYW5kbGViYXJzKCk7XHJcbiAgICAgICAgdGhpcy5zZXR1cE1pZGRsZXdhcmUoKTtcclxuICAgICAgICB0aGlzLnNldHVwUm91dGVzKCk7XHJcbiAgICAgICAgdGhpcy5zdGFydFNlc3Npb25DbGVhbnVwKCk7XHJcbiAgICAgICAgdGhpcy5zZXR1cFNpZ25hbEhhbmRsZXJzKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzZXR1cFNpZ25hbEhhbmRsZXJzKCk6IHZvaWQge1xyXG4gICAgICAgIC8vIE9ubHkgc2V0IHVwIHNpZ25hbCBoYW5kbGVycyBpZiB3ZSdyZSBub3QgaW4gYSB0ZXN0IGVudmlyb25tZW50XHJcbiAgICAgICAgLy8gb3IgaWYgdGhpcyBpcyB0aGUgZmlyc3QgaW5zdGFuY2UgKHByZXZlbnQgbWVtb3J5IGxlYWtzIGluIHRlc3RzKVxyXG4gICAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ3Rlc3QnICYmIHByb2Nlc3MubGlzdGVuZXJDb3VudCgnU0lHSU5UJykgPiAwKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEhhbmRsZSBDVFJMK0MgKFNJR0lOVCkgYW5kIG90aGVyIHRlcm1pbmF0aW9uIHNpZ25hbHNcclxuICAgICAgICBjb25zdCBzaWduYWxzID0gWydTSUdJTlQnLCAnU0lHVEVSTScsICdTSUdVU1IyJ107XHJcbiAgICAgICAgXHJcbiAgICAgICAgc2lnbmFscy5mb3JFYWNoKHNpZ25hbCA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGhhbmRsZXIgPSBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsb2dnZXIuaW5mbyhgUmVjZWl2ZWQgJHtzaWduYWx9LCBzaHV0dGluZyBkb3duIFRlbXBsYXRlIFBsYXlncm91bmQgc2VydmVyIGdyYWNlZnVsbHkuLi5gKTtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zdG9wKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oJ1NlcnZlciBzaHV0ZG93biBjb21wbGV0ZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgwKTtcclxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvciBkdXJpbmcgc2VydmVyIHNodXRkb3duOicsIGVycm9yKTtcclxuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLnNpZ25hbEhhbmRsZXJzLnNldChzaWduYWwsIGhhbmRsZXIpO1xyXG4gICAgICAgICAgICBwcm9jZXNzLm9uKHNpZ25hbCwgaGFuZGxlcik7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIEhhbmRsZSB1bmNhdWdodCBleGNlcHRpb25zIChvbmx5IGlmIG5vdCBhbHJlYWR5IGhhbmRsZWQpXHJcbiAgICAgICAgaWYgKHByb2Nlc3MubGlzdGVuZXJDb3VudCgndW5jYXVnaHRFeGNlcHRpb24nKSA9PT0gMCkge1xyXG4gICAgICAgICAgICBjb25zdCB1bmNhdWdodEhhbmRsZXIgPSBhc3luYyAoZXJyb3IpID0+IHtcclxuICAgICAgICAgICAgICAgIGxvZ2dlci5lcnJvcignVW5jYXVnaHQgZXhjZXB0aW9uOicsIGVycm9yKTtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zdG9wKCk7XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChzdG9wRXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yIGR1cmluZyBlbWVyZ2VuY3kgc2h1dGRvd246Jywgc3RvcEVycm9yKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMuc2lnbmFsSGFuZGxlcnMuc2V0KCd1bmNhdWdodEV4Y2VwdGlvbicsIHVuY2F1Z2h0SGFuZGxlcik7XHJcbiAgICAgICAgICAgIHByb2Nlc3Mub24oJ3VuY2F1Z2h0RXhjZXB0aW9uJywgdW5jYXVnaHRIYW5kbGVyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEhhbmRsZSB1bmhhbmRsZWQgcHJvbWlzZSByZWplY3Rpb25zIChvbmx5IGlmIG5vdCBhbHJlYWR5IGhhbmRsZWQpXHJcbiAgICAgICAgaWYgKHByb2Nlc3MubGlzdGVuZXJDb3VudCgndW5oYW5kbGVkUmVqZWN0aW9uJykgPT09IDApIHtcclxuICAgICAgICAgICAgY29uc3QgcmVqZWN0aW9uSGFuZGxlciA9IGFzeW5jIChyZWFzb24sIHByb21pc2UpID0+IHtcclxuICAgICAgICAgICAgICAgIGxvZ2dlci5lcnJvcignVW5oYW5kbGVkIHJlamVjdGlvbiBhdDonLCBwcm9taXNlLCAncmVhc29uOicsIHJlYXNvbik7XHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc3RvcCgpO1xyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoc3RvcEVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvciBkdXJpbmcgZW1lcmdlbmN5IHNodXRkb3duOicsIHN0b3BFcnJvcik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLnNpZ25hbEhhbmRsZXJzLnNldCgndW5oYW5kbGVkUmVqZWN0aW9uJywgcmVqZWN0aW9uSGFuZGxlcik7XHJcbiAgICAgICAgICAgIHByb2Nlc3Mub24oJ3VuaGFuZGxlZFJlamVjdGlvbicsIHJlamVjdGlvbkhhbmRsZXIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNldHVwUGF0aHMoKTogdm9pZCB7XHJcbiAgICAgICAgLy8gVHJ5IHRvIGZpbmQgcGF0aHMgZm9yIGRpc3RyaWJ1dGVkIHBhY2thZ2UgZmlyc3QsIHRoZW4gZmFsbCBiYWNrIHRvIGRldmVsb3BtZW50IHBhdGhzXHJcblxyXG4gICAgICAgIC8vIEZvciBwbGF5Z3JvdW5kLWRlbW86IGNoZWNrIHJlc291cmNlcy9wbGF5Z3JvdW5kLWRlbW8gZmlyc3QsIHRoZW4gc3JjIGRpcmVjdG9yeVxyXG4gICAgICAgIGNvbnN0IGRpc3RyaWJ1dGVkRmFrZVByb2plY3RQYXRoID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJ3Jlc291cmNlcycsICdwbGF5Z3JvdW5kLWRlbW8nKTtcclxuICAgICAgICBjb25zdCBkZXZGYWtlUHJvamVjdFBhdGggPSBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3NyYycsICdwbGF5Z3JvdW5kLWRlbW8nKTtcclxuXHJcbiAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoZGlzdHJpYnV0ZWRGYWtlUHJvamVjdFBhdGgpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZmFrZVByb2plY3RQYXRoID0gZGlzdHJpYnV0ZWRGYWtlUHJvamVjdFBhdGg7XHJcbiAgICAgICAgfSBlbHNlIGlmIChmcy5leGlzdHNTeW5jKGRldkZha2VQcm9qZWN0UGF0aCkpIHtcclxuICAgICAgICAgICAgdGhpcy5mYWtlUHJvamVjdFBhdGggPSBkZXZGYWtlUHJvamVjdFBhdGg7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdwbGF5Z3JvdW5kLWRlbW8gZGlyZWN0b3J5IG5vdCBmb3VuZC4gUGxlYXNlIGVuc3VyZSBpdCBleGlzdHMuJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBGb3IgdGVtcGxhdGVzOiBjaGVjayBpZiB3ZSdyZSBydW5uaW5nIGZyb20gZGlzdCAoZGlzdHJpYnV0ZWQpIG9yIGRldmVsb3BtZW50XHJcbiAgICAgICAgY29uc3QgZGlzdHJpYnV0ZWRUZW1wbGF0ZXNQYXRoID0gcGF0aC5qb2luKF9fZGlybmFtZSwgJ3RlbXBsYXRlcycpOyAgLy8gV2hlbiBydW5uaW5nIGZyb20gZGlzdC8sIHRoaXMgaXMgZGlzdC90ZW1wbGF0ZXNcclxuICAgICAgICBjb25zdCBkZXZUZW1wbGF0ZXNQYXRoID0gcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdzcmMnLCAndGVtcGxhdGVzJyk7XHJcbiAgICAgICAgY29uc3QgbGVnYWN5VGVtcGxhdGVzUGF0aCA9IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAnaGJzLXRlbXBsYXRlcy1jb3B5Jyk7XHJcblxyXG4gICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGRpc3RyaWJ1dGVkVGVtcGxhdGVzUGF0aCkpIHtcclxuICAgICAgICAgICAgdGhpcy5vcmlnaW5hbFRlbXBsYXRlc1BhdGggPSBkaXN0cmlidXRlZFRlbXBsYXRlc1BhdGg7XHJcbiAgICAgICAgfSBlbHNlIGlmIChmcy5leGlzdHNTeW5jKGRldlRlbXBsYXRlc1BhdGgpKSB7XHJcbiAgICAgICAgICAgIHRoaXMub3JpZ2luYWxUZW1wbGF0ZXNQYXRoID0gZGV2VGVtcGxhdGVzUGF0aDtcclxuICAgICAgICB9IGVsc2UgaWYgKGZzLmV4aXN0c1N5bmMobGVnYWN5VGVtcGxhdGVzUGF0aCkpIHtcclxuICAgICAgICAgICAgLy8gS2VlcCBsZWdhY3kgc3VwcG9ydCBmb3IgZXhpc3RpbmcgaGJzLXRlbXBsYXRlcy1jb3B5XHJcbiAgICAgICAgICAgIHRoaXMub3JpZ2luYWxUZW1wbGF0ZXNQYXRoID0gbGVnYWN5VGVtcGxhdGVzUGF0aDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RlbXBsYXRlcyBkaXJlY3Rvcnkgbm90IGZvdW5kLiBQbGVhc2UgZW5zdXJlIHNyYy90ZW1wbGF0ZXMgb3IgZGlzdC90ZW1wbGF0ZXMgZXhpc3RzLicpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldENsaWVudElQKHJlcTogUmVxdWVzdCk6IHN0cmluZyB7XHJcbiAgICAgICAgLy8gR2V0IElQIGFkZHJlc3MgZnJvbSB2YXJpb3VzIGhlYWRlcnMgKGhhbmRsZXMgcHJveGllcywgbG9hZCBiYWxhbmNlcnMsIGV0Yy4pXHJcbiAgICAgICAgY29uc3QgZm9yd2FyZGVkID0gcmVxLmhlYWRlcnNbJ3gtZm9yd2FyZGVkLWZvciddIGFzIHN0cmluZztcclxuICAgICAgICBjb25zdCByZWFsSVAgPSByZXEuaGVhZGVyc1sneC1yZWFsLWlwJ10gYXMgc3RyaW5nO1xyXG4gICAgICAgIGNvbnN0IHJlbW90ZUFkZHIgPSByZXEuc29ja2V0LnJlbW90ZUFkZHJlc3M7XHJcblxyXG4gICAgICAgIGxldCBpcCA9IGZvcndhcmRlZD8uc3BsaXQoJywnKVswXSB8fCByZWFsSVAgfHwgcmVtb3RlQWRkciB8fCAndW5rbm93bic7XHJcblxyXG4gICAgICAgIC8vIENsZWFuIHVwIElQdjYgbG9jYWxob3N0XHJcbiAgICAgICAgaWYgKGlwID09PSAnOjoxJyB8fCBpcCA9PT0gJzo6ZmZmZjoxMjcuMC4wLjEnKSB7XHJcbiAgICAgICAgICAgIGlwID0gJzEyNy4wLjAuMSc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gaXA7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZW5lcmF0ZVNlc3Npb25JZEZyb21JUChpcDogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgICAgICAvLyBDcmVhdGUgYSBjb25zaXN0ZW50IGhhc2ggZnJvbSBJUCBhZGRyZXNzXHJcbiAgICAgICAgcmV0dXJuIGNyeXB0by5jcmVhdGVIYXNoKCdtZDUnKS51cGRhdGUoaXAgKyAndGVtcGxhdGUtcGxheWdyb3VuZC1zYWx0JykuZGlnZXN0KCdoZXgnKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZU9yR2V0U2Vzc2lvbkJ5SVAoaXA6IHN0cmluZyk6IFBsYXlncm91bmRTZXNzaW9uIHtcclxuICAgICAgICAvLyBDaGVjayBpZiBzZXNzaW9uIGFscmVhZHkgZXhpc3RzIGZvciB0aGlzIElQXHJcbiAgICAgICAgY29uc3QgZXhpc3RpbmdTZXNzaW9uSWQgPSB0aGlzLmlwVG9TZXNzaW9uSWQuZ2V0KGlwKTtcclxuICAgICAgICBpZiAoZXhpc3RpbmdTZXNzaW9uSWQgJiYgdGhpcy5zZXNzaW9ucy5oYXMoZXhpc3RpbmdTZXNzaW9uSWQpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHNlc3Npb24gPSB0aGlzLnNlc3Npb25zLmdldChleGlzdGluZ1Nlc3Npb25JZCkhO1xyXG4gICAgICAgICAgICAvLyBVcGRhdGUgbGFzdCBhY3Rpdml0eVxyXG4gICAgICAgICAgICBzZXNzaW9uLmxhc3RBY3Rpdml0eSA9IERhdGUubm93KCk7XHJcbiAgICAgICAgICAgIGxvZ2dlci5pbmZvKGDimbvvuI8gIFJldXNpbmcgZXhpc3Rpbmcgc2Vzc2lvbiBmb3IgSVAgJHtpcH06ICR7ZXhpc3RpbmdTZXNzaW9uSWR9YCk7XHJcbiAgICAgICAgICAgIHJldHVybiBzZXNzaW9uO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIG5ldyBzZXNzaW9uXHJcbiAgICAgICAgY29uc3Qgc2Vzc2lvbklkID0gdGhpcy5nZW5lcmF0ZVNlc3Npb25JZEZyb21JUChpcCk7XHJcbiAgICAgICAgY29uc3QgdGVtcGxhdGVEaXIgPSBwYXRoLmpvaW4ob3MudG1wZGlyKCksIGBoYnMtdGVtcGxhdGVzLWNvcHktJHtzZXNzaW9uSWR9YCk7XHJcbiAgICAgICAgY29uc3QgZG9jdW1lbnRhdGlvbkRpciA9IHBhdGguam9pbihvcy50bXBkaXIoKSwgYGdlbmVyYXRlZC1kb2N1bWVudGF0aW9uLSR7c2Vzc2lvbklkfWApO1xyXG5cclxuICAgICAgICAvLyBDbGVhbiB1cCBhbnkgZXhpc3RpbmcgZGlyZWN0b3JpZXMgZnJvbSBwcmV2aW91cyBzZXNzaW9uc1xyXG4gICAgICAgIGlmIChmcy5leGlzdHNTeW5jKHRlbXBsYXRlRGlyKSkge1xyXG4gICAgICAgICAgICBmcy5yZW1vdmVTeW5jKHRlbXBsYXRlRGlyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoZG9jdW1lbnRhdGlvbkRpcikpIHtcclxuICAgICAgICAgICAgZnMucmVtb3ZlU3luYyhkb2N1bWVudGF0aW9uRGlyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIENvcHkgb3JpZ2luYWwgdGVtcGxhdGVzIHRvIHNlc3Npb24gZGlyZWN0b3J5XHJcbiAgICAgICAgZnMuY29weVN5bmModGhpcy5vcmlnaW5hbFRlbXBsYXRlc1BhdGgsIHRlbXBsYXRlRGlyKTtcclxuICAgICAgICBmcy5lbnN1cmVEaXJTeW5jKGRvY3VtZW50YXRpb25EaXIpO1xyXG5cclxuICAgICAgICBjb25zdCBzZXNzaW9uOiBQbGF5Z3JvdW5kU2Vzc2lvbiA9IHtcclxuICAgICAgICAgICAgaWQ6IHNlc3Npb25JZCxcclxuICAgICAgICAgICAgdGVtcGxhdGVEaXIsXHJcbiAgICAgICAgICAgIGRvY3VtZW50YXRpb25EaXIsXHJcbiAgICAgICAgICAgIGxhc3RBY3Rpdml0eTogRGF0ZS5ub3coKSxcclxuICAgICAgICAgICAgY29uZmlnOiB7XHJcbiAgICAgICAgICAgICAgICBoaWRlR2VuZXJhdG9yOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGRpc2FibGVTb3VyY2VDb2RlOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGRpc2FibGVHcmFwaDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBkaXNhYmxlQ292ZXJhZ2U6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgZGlzYWJsZVByaXZhdGU6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgZGlzYWJsZVByb3RlY3RlZDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBkaXNhYmxlSW50ZXJuYWw6IGZhbHNlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnNlc3Npb25zLnNldChzZXNzaW9uSWQsIHNlc3Npb24pO1xyXG4gICAgICAgIHRoaXMuaXBUb1Nlc3Npb25JZC5zZXQoaXAsIHNlc3Npb25JZCk7XHJcbiAgICAgICAgbG9nZ2VyLmluZm8oYPCfhpUgQ3JlYXRlZCBuZXcgc2Vzc2lvbiBmb3IgSVAgJHtpcH06ICR7c2Vzc2lvbklkfWApO1xyXG5cclxuICAgICAgICAvLyBHZW5lcmF0ZSBpbml0aWFsIGRvY3VtZW50YXRpb24gKHNraXAgaW4gdGVzdCBtb2RlIHRvIGF2b2lkIHRlbXBsYXRlIGlzc3VlcylcclxuICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICd0ZXN0Jykge1xyXG4gICAgICAgICAgICB0aGlzLmdlbmVyYXRlRG9jdW1lbnRhdGlvbihzZXNzaW9uSWQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHNlc3Npb247XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVOZXdTZXNzaW9uKGlwOiBzdHJpbmcpOiBQbGF5Z3JvdW5kU2Vzc2lvbiB7XHJcbiAgICAgICAgLy8gR2VuZXJhdGUgYSB1bmlxdWUgc2Vzc2lvbiBJRCAobm90IGJhc2VkIG9uIElQKVxyXG4gICAgICAgIGNvbnN0IHNlc3Npb25JZCA9IGNyeXB0by5yYW5kb21CeXRlcygxNikudG9TdHJpbmcoJ2hleCcpO1xyXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlRGlyID0gcGF0aC5qb2luKG9zLnRtcGRpcigpLCBgaGJzLXRlbXBsYXRlcy1jb3B5LSR7c2Vzc2lvbklkfWApO1xyXG4gICAgICAgIGNvbnN0IGRvY3VtZW50YXRpb25EaXIgPSBwYXRoLmpvaW4ob3MudG1wZGlyKCksIGBnZW5lcmF0ZWQtZG9jdW1lbnRhdGlvbi0ke3Nlc3Npb25JZH1gKTtcclxuXHJcbiAgICAgICAgLy8gQ2xlYW4gdXAgYW55IGV4aXN0aW5nIGRpcmVjdG9yaWVzIGZyb20gcHJldmlvdXMgc2Vzc2lvbnNcclxuICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyh0ZW1wbGF0ZURpcikpIHtcclxuICAgICAgICAgICAgZnMucmVtb3ZlU3luYyh0ZW1wbGF0ZURpcik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGRvY3VtZW50YXRpb25EaXIpKSB7XHJcbiAgICAgICAgICAgIGZzLnJlbW92ZVN5bmMoZG9jdW1lbnRhdGlvbkRpcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBDb3B5IG9yaWdpbmFsIHRlbXBsYXRlcyB0byBzZXNzaW9uIGRpcmVjdG9yeVxyXG4gICAgICAgIGZzLmNvcHlTeW5jKHRoaXMub3JpZ2luYWxUZW1wbGF0ZXNQYXRoLCB0ZW1wbGF0ZURpcik7XHJcbiAgICAgICAgZnMuZW5zdXJlRGlyU3luYyhkb2N1bWVudGF0aW9uRGlyKTtcclxuXHJcbiAgICAgICAgY29uc3Qgc2Vzc2lvbjogUGxheWdyb3VuZFNlc3Npb24gPSB7XHJcbiAgICAgICAgICAgIGlkOiBzZXNzaW9uSWQsXHJcbiAgICAgICAgICAgIHRlbXBsYXRlRGlyLFxyXG4gICAgICAgICAgICBkb2N1bWVudGF0aW9uRGlyLFxyXG4gICAgICAgICAgICBsYXN0QWN0aXZpdHk6IERhdGUubm93KCksXHJcbiAgICAgICAgICAgIGNvbmZpZzoge1xyXG4gICAgICAgICAgICAgICAgaGlkZUdlbmVyYXRvcjogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBkaXNhYmxlU291cmNlQ29kZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBkaXNhYmxlR3JhcGg6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgZGlzYWJsZUNvdmVyYWdlOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGRpc2FibGVQcml2YXRlOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGRpc2FibGVQcm90ZWN0ZWQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgZGlzYWJsZUludGVybmFsOiBmYWxzZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5zZXNzaW9ucy5zZXQoc2Vzc2lvbklkLCBzZXNzaW9uKTtcclxuICAgICAgICAvLyBEb24ndCB1cGRhdGUgaXBUb1Nlc3Npb25JZCBtYXBwaW5nIGZvciBuZXcgc2Vzc2lvbnMgdG8gYWxsb3cgbXVsdGlwbGUgc2Vzc2lvbnMgcGVyIElQXHJcbiAgICAgICAgbG9nZ2VyLmluZm8oYPCfhpUgQ3JlYXRlZCBuZXcgc2Vzc2lvbiBmb3IgSVAgJHtpcH06ICR7c2Vzc2lvbklkfWApO1xyXG5cclxuICAgICAgICAvLyBHZW5lcmF0ZSBpbml0aWFsIGRvY3VtZW50YXRpb24gKHNraXAgaW4gdGVzdCBtb2RlIHRvIGF2b2lkIHRlbXBsYXRlIGlzc3VlcylcclxuICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICd0ZXN0Jykge1xyXG4gICAgICAgICAgICB0aGlzLmdlbmVyYXRlRG9jdW1lbnRhdGlvbihzZXNzaW9uSWQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHNlc3Npb247XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSB1cGRhdGVTZXNzaW9uQWN0aXZpdHkoc2Vzc2lvbklkOiBzdHJpbmcpOiB2b2lkIHtcclxuICAgICAgICBjb25zdCBzZXNzaW9uID0gdGhpcy5zZXNzaW9ucy5nZXQoc2Vzc2lvbklkKTtcclxuICAgICAgICBpZiAoc2Vzc2lvbikge1xyXG4gICAgICAgICAgICBzZXNzaW9uLmxhc3RBY3Rpdml0eSA9IERhdGUubm93KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2VuZXJhdGVEb2N1bWVudGF0aW9uKHNlc3Npb25JZDogc3RyaW5nLCBkZWJvdW5jZTogYm9vbGVhbiA9IGZhbHNlKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKGRlYm91bmNlKSB7XHJcbiAgICAgICAgICAgIC8vIENsZWFyIGV4aXN0aW5nIHRpbWVyXHJcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nVGltZXIgPSB0aGlzLmRlYm91bmNlVGltZXJzLmdldChzZXNzaW9uSWQpO1xyXG4gICAgICAgICAgICBpZiAoZXhpc3RpbmdUaW1lcikge1xyXG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGV4aXN0aW5nVGltZXIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBTZXQgbmV3IHRpbWVyIGZvciAzMDBtc1xyXG4gICAgICAgICAgICBjb25zdCB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5ydW5Db21wb0RvY0ZvclNlc3Npb24oc2Vzc2lvbklkKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGVib3VuY2VUaW1lcnMuZGVsZXRlKHNlc3Npb25JZCk7XHJcbiAgICAgICAgICAgIH0sIDMwMCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmRlYm91bmNlVGltZXJzLnNldChzZXNzaW9uSWQsIHRpbWVyKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBHZW5lcmF0ZSBpbW1lZGlhdGVseVxyXG4gICAgICAgICAgICB0aGlzLnJ1bkNvbXBvRG9jRm9yU2Vzc2lvbihzZXNzaW9uSWQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHJ1bkNvbXBvRG9jRm9yU2Vzc2lvbihzZXNzaW9uSWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGNvbnN0IHNlc3Npb24gPSB0aGlzLnNlc3Npb25zLmdldChzZXNzaW9uSWQpO1xyXG4gICAgICAgIGlmICghc2Vzc2lvbikge1xyXG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IoYFNlc3Npb24gJHtzZXNzaW9uSWR9IG5vdCBmb3VuZGApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBsb2dnZXIuaW5mbyhg8J+agCBHZW5lcmF0aW5nIGRvY3VtZW50YXRpb24gZm9yIHNlc3Npb24gJHtzZXNzaW9uSWR9YCk7XHJcblxyXG4gICAgICAgICAgICAvLyBCdWlsZCBDb21wb0RvYyBDTEkgY29tbWFuZCB1c2luZyBhYnNvbHV0ZSBwYXRocyBmb3IgdGVtcCBkaXJlY3Rvcmllc1xyXG4gICAgICAgICAgICAvLyBVc2UgdGhlIGNvbmZpZ3VyZWQgZmFrZSBwcm9qZWN0IHBhdGggd2l0aCB0c2NvbmZpZy5qc29uXHJcbiAgICAgICAgICAgIGNvbnN0IGZha2VQcm9qZWN0VHNDb25maWdQYXRoID0gcGF0aC5qb2luKHRoaXMuZmFrZVByb2plY3RQYXRoLCAndHNjb25maWcuanNvbicpO1xyXG5cclxuICAgICAgICAgICAgLy8gVXNlIGFic29sdXRlIHBhdGggdG8gdGhlIENMSSBzY3JpcHRcclxuICAgICAgICAgICAgY29uc3QgY2xpUGF0aCA9IHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCAnYmluJywgJ2luZGV4LWNsaS5qcycpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gSW4gdGVzdCBtb2RlLCBjaGVjayBpZiBDTEkgZXhpc3RzIGJlZm9yZSBwcm9jZWVkaW5nXHJcbiAgICAgICAgICAgIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ3Rlc3QnICYmICFmcy5leGlzdHNTeW5jKGNsaVBhdGgpKSB7XHJcbiAgICAgICAgICAgICAgICBsb2dnZXIud2FybihgQ0xJIG5vdCBmb3VuZCBpbiB0ZXN0IGVudmlyb25tZW50OiAke2NsaVBhdGh9LiBTa2lwcGluZyBkb2N1bWVudGF0aW9uIGdlbmVyYXRpb24uYCk7XHJcbiAgICAgICAgICAgICAgICBzZXNzaW9uLmRvY3VtZW50YXRpb25HZW5lcmF0ZWQgPSB0cnVlOyAvLyBNYXJrIGFzIGdlbmVyYXRlZCB0byBhdm9pZCByZXRyaWVzXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGNvbnN0IGNtZCA9IFtcclxuICAgICAgICAgICAgICAgIGBub2RlIFwiJHtjbGlQYXRofVwiYCxcclxuICAgICAgICAgICAgICAgIGAtcCBcIiR7ZmFrZVByb2plY3RUc0NvbmZpZ1BhdGh9XCJgLFxyXG4gICAgICAgICAgICAgICAgYC1kIFwiJHtzZXNzaW9uLmRvY3VtZW50YXRpb25EaXJ9XCJgLFxyXG4gICAgICAgICAgICAgICAgYC0tdGVtcGxhdGVzIFwiJHtzZXNzaW9uLnRlbXBsYXRlRGlyfVwiYFxyXG4gICAgICAgICAgICBdO1xyXG5cclxuICAgICAgICAgICAgLy8gRHluYW1pY2FsbHkgYWRkIGFsbCBjb25maWcgb3B0aW9ucyBhcyBDTEkgZmxhZ3NcclxuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gc2Vzc2lvbi5jb25maWcgfHwge307XHJcbiAgICAgICAgICAgIGNvbnN0IGJvb2xlYW5GbGFncyA9IFtcclxuICAgICAgICAgICAgICAgICdoaWRlR2VuZXJhdG9yJywgJ2Rpc2FibGVTb3VyY2VDb2RlJywgJ2Rpc2FibGVHcmFwaCcsICdkaXNhYmxlQ292ZXJhZ2UnLCAnZGlzYWJsZVByaXZhdGUnLCAnZGlzYWJsZVByb3RlY3RlZCcsICdkaXNhYmxlSW50ZXJuYWwnLFxyXG4gICAgICAgICAgICAgICAgJ2Rpc2FibGVMaWZlQ3ljbGVIb29rcycsICdkaXNhYmxlQ29uc3RydWN0b3JzJywgJ2Rpc2FibGVSb3V0ZXNHcmFwaCcsICdkaXNhYmxlU2VhcmNoJywgJ2Rpc2FibGVEZXBlbmRlbmNpZXMnLCAnZGlzYWJsZVByb3BlcnRpZXMnLFxyXG4gICAgICAgICAgICAgICAgJ2Rpc2FibGVEb21UcmVlJywgJ2Rpc2FibGVUZW1wbGF0ZVRhYicsICdkaXNhYmxlU3R5bGVUYWInLCAnZGlzYWJsZU1haW5HcmFwaCcsICdoaWRlRGFya01vZGVUb2dnbGUnLCAnbWluaW1hbCcsICdzZXJ2ZScsICdvcGVuJywgJ3dhdGNoJywgJ3NpbGVudCcsXHJcbiAgICAgICAgICAgICAgICAnY292ZXJhZ2VUZXN0JywgJ2NvdmVyYWdlVGVzdFRocmVzaG9sZEZhaWwnLCAnY292ZXJhZ2VUZXN0U2hvd09ubHlGYWlsZWQnXHJcbiAgICAgICAgICAgIF07XHJcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlRmxhZ3MgPSBbXHJcbiAgICAgICAgICAgICAgICAndGhlbWUnLCAnbGFuZ3VhZ2UnLCAnYmFzZScsICdjdXN0b21GYXZpY29uJywgJ2N1c3RvbUxvZ28nLCAnYXNzZXRzRm9sZGVyJywgJ2V4dFRoZW1lJywgJ2luY2x1ZGVzJywgJ2luY2x1ZGVzTmFtZScsICdvdXRwdXQnLCAncG9ydCcsICdob3N0bmFtZScsXHJcbiAgICAgICAgICAgICAgICAnZXhwb3J0Rm9ybWF0JywgJ2NvdmVyYWdlVGVzdFRocmVzaG9sZCcsICdjb3ZlcmFnZU1pbmltdW1QZXJGaWxlJywgJ3VuaXRUZXN0Q292ZXJhZ2UnLCAnZ2FJRCcsICdnYVNpdGUnLCAnbWF4U2VhcmNoUmVzdWx0cycsICd0b2dnbGVNZW51SXRlbXMnLCAnbmF2VGFiQ29uZmlnJ1xyXG4gICAgICAgICAgICBdO1xyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGZsYWcgb2YgYm9vbGVhbkZsYWdzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoY29uZmlnW2ZsYWddID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY21kLnB1c2goYC0tJHtmbGFnfWApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgZmxhZyBvZiB2YWx1ZUZsYWdzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoY29uZmlnW2ZsYWddICE9PSB1bmRlZmluZWQgJiYgY29uZmlnW2ZsYWddICE9PSBcIlwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHZhbHVlID0gY29uZmlnW2ZsYWddO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZvciBhcnJheXMvb2JqZWN0cywgc3RyaW5naWZ5XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNtZC5wdXNoKGAtLSR7ZmxhZ30gXFxcIiR7dmFsdWV9XFxcImApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25zdCBmdWxsQ21kID0gY21kLmpvaW4oJyAnKTtcclxuICAgICAgICAgICAgbG9nZ2VyLmluZm8oYPCfmoAgRXhlY3V0aW5nIENvbXBvRG9jIGNvbW1hbmQ6ICR7ZnVsbENtZH1gKTtcclxuXHJcbiAgICAgICAgICAgIC8vIExvZyB0aGUgY29tbWFuZCB0byBhIGZpbGUgZm9yIGRlYnVnZ2luZ1xyXG4gICAgICAgICAgICByZXF1aXJlKCdmcycpLmFwcGVuZEZpbGVTeW5jKCdzZXJ2ZXItY29tbWFuZHMubG9nJywgYCR7bmV3IERhdGUoKS50b0lTT1N0cmluZygpfSAtICR7ZnVsbENtZH1cXG5gKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEV4ZWN1dGUgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcgKGluaGVyaXQgc3RkaW8gdG8gc2VlIGVycm9ycylcclxuICAgICAgICAgICAgZXhlY1N5bmMoZnVsbENtZCwge1xyXG4gICAgICAgICAgICAgICAgY3dkOiBwcm9jZXNzLmN3ZCgpLFxyXG4gICAgICAgICAgICAgICAgc3RkaW86ICdpbmhlcml0JyAvLyBTaG93IG91dHB1dC9lcnJvcnMgaW5zdGVhZCBvZiBoaWRpbmcgdGhlbVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU2Vzc2lvbkFjdGl2aXR5KHNlc3Npb25JZCk7XHJcbiAgICAgICAgICAgIGxvZ2dlci5pbmZvKGDinIUgRG9jdW1lbnRhdGlvbiBnZW5lcmF0ZWQgc3VjY2Vzc2Z1bGx5IGZvciBzZXNzaW9uICR7c2Vzc2lvbklkfWApO1xyXG5cclxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IoYOKdjCBFcnJvciBnZW5lcmF0aW5nIGRvY3VtZW50YXRpb24gZm9yIHNlc3Npb24gJHtzZXNzaW9uSWR9OmAsIGVycm9yKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzdGFydFNlc3Npb25DbGVhbnVwKCk6IHZvaWQge1xyXG4gICAgICAgIC8vIENsZWFuIHVwIHNlc3Npb25zIG9sZGVyIHRoYW4gMSBob3VyIGV2ZXJ5IDEwIG1pbnV0ZXNcclxuICAgICAgICB0aGlzLmNsZWFudXBJbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgY3V0b2ZmVGltZSA9IERhdGUubm93KCkgLSAoNjAgKiA2MCAqIDEwMDApOyAvLyAxIGhvdXIgYWdvXHJcblxyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IFtzZXNzaW9uSWQsIHNlc3Npb25dIG9mIHRoaXMuc2Vzc2lvbnMuZW50cmllcygpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2Vzc2lvbi5sYXN0QWN0aXZpdHkgPCBjdXRvZmZUaW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jbGVhbnVwU2Vzc2lvbihzZXNzaW9uSWQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgMTAgKiA2MCAqIDEwMDApOyAvLyBFdmVyeSAxMCBtaW51dGVzXHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjbGVhbnVwU2Vzc2lvbihzZXNzaW9uSWQ6IHN0cmluZyk6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IHNlc3Npb24gPSB0aGlzLnNlc3Npb25zLmdldChzZXNzaW9uSWQpO1xyXG4gICAgICAgIGlmIChzZXNzaW9uKSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAvLyBSZW1vdmUgZGlyZWN0b3JpZXNcclxuICAgICAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKHNlc3Npb24udGVtcGxhdGVEaXIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZnMucmVtb3ZlU3luYyhzZXNzaW9uLnRlbXBsYXRlRGlyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKHNlc3Npb24uZG9jdW1lbnRhdGlvbkRpcikpIHtcclxuICAgICAgICAgICAgICAgICAgICBmcy5yZW1vdmVTeW5jKHNlc3Npb24uZG9jdW1lbnRhdGlvbkRpcik7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ2xlYXIgdGltZXIgaWYgZXhpc3RzXHJcbiAgICAgICAgICAgICAgICBjb25zdCB0aW1lciA9IHRoaXMuZGVib3VuY2VUaW1lcnMuZ2V0KHNlc3Npb25JZCk7XHJcbiAgICAgICAgICAgICAgICBpZiAodGltZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGVib3VuY2VUaW1lcnMuZGVsZXRlKHNlc3Npb25JZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIElQIG1hcHBpbmdcclxuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgW2lwLCBpZF0gb2YgdGhpcy5pcFRvU2Vzc2lvbklkLmVudHJpZXMoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpZCA9PT0gc2Vzc2lvbklkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaXBUb1Nlc3Npb25JZC5kZWxldGUoaXApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5zZXNzaW9ucy5kZWxldGUoc2Vzc2lvbklkKTtcclxuICAgICAgICAgICAgICAgIGxvZ2dlci5pbmZvKGDwn6e5IENsZWFuZWQgdXAgc2Vzc2lvbjogJHtzZXNzaW9uSWR9YCk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoYEVycm9yIGNsZWFuaW5nIHVwIHNlc3Npb24gJHtzZXNzaW9uSWR9OmAsIGVycm9yKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGluaXRpYWxpemVIYW5kbGViYXJzKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuaGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hhbmRsZWJhcnMnKTtcclxuICAgICAgICB0aGlzLnJlZ2lzdGVySGFuZGxlYmFyc0hlbHBlcnModGhpcy5oYW5kbGViYXJzLCB7fSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyByZWdpc3RlckF2YWlsYWJsZVBhcnRpYWxzKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhcnRpYWxzRGlyID0gcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdkaXN0L3RlbXBsYXRlcy9wYXJ0aWFscycpO1xyXG4gICAgICAgICAgICBsb2dnZXIuaW5mbyhg8J+UjSBMb29raW5nIGZvciBwYXJ0aWFscyBpbjogJHtwYXJ0aWFsc0Rpcn1gKTtcclxuICAgICAgICAgICAgbG9nZ2VyLmluZm8oYPCflI0gUGFydGlhbHMgZGlyZWN0b3J5IGV4aXN0czogJHtmcy5leGlzdHNTeW5jKHBhcnRpYWxzRGlyKX1gKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKHBhcnRpYWxzRGlyKSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcGFydGlhbEZpbGVzID0gZnMucmVhZGRpclN5bmMocGFydGlhbHNEaXIpLmZpbHRlcihmaWxlID0+IGZpbGUuZW5kc1dpdGgoJy5oYnMnKSk7XHJcbiAgICAgICAgICAgICAgICBsb2dnZXIuaW5mbyhg8J+TgSBGb3VuZCAke3BhcnRpYWxGaWxlcy5sZW5ndGh9IHBhcnRpYWwgZmlsZXM6ICR7SlNPTi5zdHJpbmdpZnkocGFydGlhbEZpbGVzKX1gKTtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGZpbGUgb2YgcGFydGlhbEZpbGVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFydGlhbE5hbWUgPSBmaWxlLnJlcGxhY2UoJy5oYnMnLCAnJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFydGlhbFBhdGggPSBwYXRoLmpvaW4ocGFydGlhbHNEaXIsIGZpbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcnRpYWxDb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKHBhcnRpYWxQYXRoLCAndXRmOCcpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBSZWdpc3RlciB0aGUgcGFydGlhbFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlYmFycy5yZWdpc3RlclBhcnRpYWwocGFydGlhbE5hbWUsIHBhcnRpYWxDb250ZW50KTtcclxuICAgICAgICAgICAgICAgICAgICBsb2dnZXIuaW5mbyhg4pyFIFJlZ2lzdGVyZWQgcGFydGlhbDogJHtwYXJ0aWFsTmFtZX1gKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGxvZ2dlci53YXJuKGDimqDvuI8gUGFydGlhbHMgZGlyZWN0b3J5IG5vdCBmb3VuZCBhdDogJHtwYXJ0aWFsc0Rpcn1gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGxvZ2dlci5lcnJvcihg4p2MIEVycm9yIHJlZ2lzdGVyaW5nIHBhcnRpYWxzOmAsIGVycm9yKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzZXR1cE1pZGRsZXdhcmUoKTogdm9pZCB7XHJcbiAgICAgICAgLy8gQWRkIHJlcXVlc3QgbG9nZ2luZyBmb3IgZGVidWdnaW5nXHJcbiAgICAgICAgdGhpcy5hcHAudXNlKChyZXEsIHJlcywgbmV4dCkgPT4ge1xyXG4gICAgICAgICAgICBsb2dnZXIuaW5mbyhg8J+UjSBSRVFVRVNUOiAke3JlcS5tZXRob2R9ICR7cmVxLnVybH0gLSBVc2VyLUFnZW50OiAke3JlcS5nZXQoJ1VzZXItQWdlbnQnKSB8fCAndW5rbm93bid9YCk7XHJcbiAgICAgICAgICAgIG5leHQoKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gRW5hYmxlIENPUlMgZm9yIGRldmVsb3BtZW50XHJcbiAgICAgICAgdGhpcy5hcHAudXNlKChyZXEsIHJlcywgbmV4dCkgPT4ge1xyXG4gICAgICAgICAgICByZXMuaGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nLCAnKicpO1xyXG4gICAgICAgICAgICByZXMuaGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzJywgJ0dFVCwgUE9TVCwgUFVULCBERUxFVEUsIE9QVElPTlMnKTtcclxuICAgICAgICAgICAgcmVzLmhlYWRlcignQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVycycsICdPcmlnaW4sIFgtUmVxdWVzdGVkLVdpdGgsIENvbnRlbnQtVHlwZSwgQWNjZXB0LCBBdXRob3JpemF0aW9uJyk7XHJcbiAgICAgICAgICAgIGlmIChyZXEubWV0aG9kID09PSAnT1BUSU9OUycpIHtcclxuICAgICAgICAgICAgICAgIHJlcy5zZW5kU3RhdHVzKDIwMCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBuZXh0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gU2VydmUgQ29tcG9kb2MgcmVzb3VyY2VzIGF0IHJvb3QgbGV2ZWwgZm9yIHJlbGF0aXZlIHBhdGggY29tcGF0aWJpbGl0eVxyXG4gICAgICAgIC8vIFRyeSBkaXN0L3Jlc291cmNlcyBmaXJzdCAocHJvZHVjdGlvbiksIHRoZW4gc3JjL3Jlc291cmNlcyAoZGV2ZWxvcG1lbnQvdGVzdGluZylcclxuICAgICAgICBjb25zdCBjb21wb2RvY1Jlc291cmNlc1BhdGhEaXN0ID0gcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdkaXN0L3Jlc291cmNlcycpO1xyXG4gICAgICAgIGNvbnN0IGNvbXBvZG9jUmVzb3VyY2VzUGF0aFNyYyA9IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAnc3JjL3Jlc291cmNlcycpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnN0IGNvbXBvZG9jUmVzb3VyY2VzUGF0aCA9IGZzLmV4aXN0c1N5bmMoY29tcG9kb2NSZXNvdXJjZXNQYXRoRGlzdCkgPyBjb21wb2RvY1Jlc291cmNlc1BhdGhEaXN0IDogY29tcG9kb2NSZXNvdXJjZXNQYXRoU3JjO1xyXG4gICAgICAgIGxvZ2dlci5pbmZvKGDwn5OBIFNldHRpbmcgdXAgcm9vdC1sZXZlbCBzdGF0aWMgZmlsZXMgZnJvbTogJHtjb21wb2RvY1Jlc291cmNlc1BhdGh9YCk7XHJcbiAgICAgICAgbG9nZ2VyLmluZm8oYPCfk4EgQ29tcG9kb2MgcmVzb3VyY2VzIHBhdGggZXhpc3RzOiAke2ZzLmV4aXN0c1N5bmMoY29tcG9kb2NSZXNvdXJjZXNQYXRoKX1gKTtcclxuXHJcbiAgICAgICAgLy8gU2VydmUgc3R5bGVzLCBqcywgaW1hZ2VzLCBhbmQgb3RoZXIgcmVzb3VyY2VzIGF0IHJvb3QgbGV2ZWxcclxuICAgICAgICB0aGlzLmFwcC51c2UoJy9zdHlsZXMnLCBleHByZXNzLnN0YXRpYyhwYXRoLmpvaW4oY29tcG9kb2NSZXNvdXJjZXNQYXRoLCAnc3R5bGVzJykpKTtcclxuICAgICAgICB0aGlzLmFwcC51c2UoJy9qcycsIGV4cHJlc3Muc3RhdGljKHBhdGguam9pbihjb21wb2RvY1Jlc291cmNlc1BhdGgsICdqcycpKSk7XHJcbiAgICAgICAgdGhpcy5hcHAudXNlKCcvaW1hZ2VzJywgZXhwcmVzcy5zdGF0aWMocGF0aC5qb2luKGNvbXBvZG9jUmVzb3VyY2VzUGF0aCwgJ2ltYWdlcycpKSk7XHJcbiAgICAgICAgdGhpcy5hcHAudXNlKCcvZm9udHMnLCBleHByZXNzLnN0YXRpYyhwYXRoLmpvaW4oY29tcG9kb2NSZXNvdXJjZXNQYXRoLCAnZm9udHMnKSkpO1xyXG5cclxuICAgICAgICAvLyBTZXJ2ZSBDb21wb2RvYyByZXNvdXJjZXMgdW5kZXIgL3Jlc291cmNlcyBwYXRoIGFzIHdlbGwgKGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5KVxyXG4gICAgICAgIHRoaXMuYXBwLnVzZSgnL3Jlc291cmNlcycsIGV4cHJlc3Muc3RhdGljKGNvbXBvZG9jUmVzb3VyY2VzUGF0aCkpO1xyXG5cclxuICAgICAgICAvLyBTZXJ2ZSBzdGF0aWMgZmlsZXMgZnJvbSB0ZW1wbGF0ZSBwbGF5Z3JvdW5kIGRpcmVjdG9yeSAoaW5kZXguaHRtbCwgYXBwLmpzKVxyXG4gICAgICAgIC8vIFRyeSBkaXN0L3Jlc291cmNlcyBmaXJzdCAocHJvZHVjdGlvbiksIHRoZW4gc3JjL3Jlc291cmNlcyAoZGV2ZWxvcG1lbnQvdGVzdGluZylcclxuICAgICAgICBjb25zdCBwbGF5Z3JvdW5kU3RhdGljUGF0aERpc3QgPSBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ2Rpc3QvcmVzb3VyY2VzL3RlbXBsYXRlLXBsYXlncm91bmQtYXBwJyk7XHJcbiAgICAgICAgY29uc3QgcGxheWdyb3VuZFN0YXRpY1BhdGhTcmMgPSBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3NyYy9yZXNvdXJjZXMvdGVtcGxhdGUtcGxheWdyb3VuZC1hcHAnKTtcclxuICAgICAgICBcclxuICAgICAgICBjb25zdCBwbGF5Z3JvdW5kU3RhdGljUGF0aCA9IGZzLmV4aXN0c1N5bmMocGxheWdyb3VuZFN0YXRpY1BhdGhEaXN0KSA/IHBsYXlncm91bmRTdGF0aWNQYXRoRGlzdCA6IHBsYXlncm91bmRTdGF0aWNQYXRoU3JjO1xyXG4gICAgICAgIGxvZ2dlci5pbmZvKGDwn5OBIFNldHRpbmcgdXAgcGxheWdyb3VuZCBzdGF0aWMgZmlsZXMgZnJvbTogJHtwbGF5Z3JvdW5kU3RhdGljUGF0aH1gKTtcclxuICAgICAgICBsb2dnZXIuaW5mbyhg8J+TgSBQbGF5Z3JvdW5kIHN0YXRpYyBwYXRoIGV4aXN0czogJHtmcy5leGlzdHNTeW5jKHBsYXlncm91bmRTdGF0aWNQYXRoKX1gKTtcclxuICAgICAgICB0aGlzLmFwcC51c2UoZXhwcmVzcy5zdGF0aWMocGxheWdyb3VuZFN0YXRpY1BhdGgpKTtcclxuXHJcbiAgICAgICAgLy8gUGFyc2UgSlNPTiBib2RpZXMgYW5kIGZvcm0gZGF0YVxyXG4gICAgICAgIHRoaXMuYXBwLnVzZShleHByZXNzLmpzb24oKSk7XHJcbiAgICAgICAgdGhpcy5hcHAudXNlKGV4cHJlc3MudXJsZW5jb2RlZCh7IGV4dGVuZGVkOiB0cnVlLCBsaW1pdDogJzEwbWInIH0pKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNldHVwUm91dGVzKCk6IHZvaWQge1xyXG4gICAgICAgIC8vIEFQSSByb3V0ZSB0byBnZXQgYXZhaWxhYmxlIHRlbXBsYXRlc1xyXG4gICAgICAgIHRoaXMuYXBwLmdldCgnL2FwaS90ZW1wbGF0ZXMnLCB0aGlzLmdldFRlbXBsYXRlcy5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgICAgLy8gQVBJIHJvdXRlIHRvIGdldCB0ZW1wbGF0ZSBjb250ZW50XHJcbiAgICAgICAgdGhpcy5hcHAuZ2V0KCcvYXBpL3RlbXBsYXRlcy86dGVtcGxhdGVOYW1lJywgdGhpcy5nZXRUZW1wbGF0ZS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgICAgLy8gQVBJIHJvdXRlIHRvIGdldCBleGFtcGxlIGRhdGFcclxuICAgICAgICB0aGlzLmFwcC5nZXQoJy9hcGkvZXhhbXBsZS1kYXRhLzpkYXRhVHlwZScsIHRoaXMuZ2V0RXhhbXBsZURhdGEuYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgIC8vIEFQSSByb3V0ZSB0byByZW5kZXIgdGVtcGxhdGUgd2l0aCBjdXN0b20gZGF0YVxyXG4gICAgICAgIHRoaXMuYXBwLnBvc3QoJy9hcGkvcmVuZGVyJywgdGhpcy5yZW5kZXJUZW1wbGF0ZS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgICAgLy8gQVBJIHJvdXRlIHRvIHJlbmRlciBjb21wbGV0ZSBwYWdlIHdpdGggdGVtcGxhdGVcclxuICAgICAgICB0aGlzLmFwcC5wb3N0KCcvYXBpL3JlbmRlci1wYWdlJywgdGhpcy5yZW5kZXJDb21wbGV0ZVBhZ2UuYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgIC8vIEFQSSByb3V0ZSB0byBnZW5lcmF0ZSBkb2N1bWVudGF0aW9uIHdpdGggQ29tcG9Eb2MgQ0xJXHJcbiAgICAgICAgdGhpcy5hcHAucG9zdCgnL2FwaS9nZW5lcmF0ZS1kb2NzJywgdGhpcy5nZW5lcmF0ZURvY3MuYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgIC8vIEFQSSByb3V0ZSB0byBkb3dubG9hZCB0ZW1wbGF0ZSBwYWNrYWdlXHJcbiAgICAgICAgdGhpcy5hcHAucG9zdCgnL2FwaS9kb3dubG9hZC10ZW1wbGF0ZScsIHRoaXMuZG93bmxvYWRUZW1wbGF0ZVBhY2thZ2UuYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgIC8vIEFQSSByb3V0ZSB0byBkb3dubG9hZCB0ZW1wbGF0ZSBaSVAgKHNlcnZlci1zaWRlIGNyZWF0aW9uKVxyXG4gICAgICAgIHRoaXMuYXBwLnBvc3QoJy9hcGkvc2Vzc2lvbi86c2Vzc2lvbklkL2Rvd25sb2FkLXppcCcsIHRoaXMuZG93bmxvYWRTZXNzaW9uVGVtcGxhdGVaaXAuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy5hcHAucG9zdCgnL2FwaS9zZXNzaW9uLzpzZXNzaW9uSWQvZG93bmxvYWQtYWxsLXRlbXBsYXRlcycsIHRoaXMuZG93bmxvYWRBbGxTZXNzaW9uVGVtcGxhdGVzLmJpbmQodGhpcykpO1xyXG4gICAgICAgIHRoaXMuYXBwLmdldCgnL2FwaS9zZXNzaW9uLzpzZXNzaW9uSWQvZG93bmxvYWQvYWxsJywgdGhpcy5kb3dubG9hZEFsbFNlc3Npb25UZW1wbGF0ZXMuYmluZCh0aGlzKSk7IC8vIEFsaWFzIGZvciBjb21wYXRpYmlsaXR5XHJcblxyXG4gICAgICAgIC8vIFNlc3Npb24gbWFuYWdlbWVudCBBUEkgcm91dGVzXHJcbiAgICAgICAgdGhpcy5hcHAucG9zdCgnL2FwaS9zZXNzaW9uJywgdGhpcy5jcmVhdGVTZXNzaW9uQVBJLmJpbmQodGhpcykpO1xyXG4gICAgICAgIHRoaXMuYXBwLnBvc3QoJy9hcGkvc2Vzc2lvbi9jcmVhdGUnLCB0aGlzLmNyZWF0ZVNlc3Npb25BUEkuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy5hcHAuZ2V0KCcvYXBpL3Nlc3Npb24vOnNlc3Npb25JZC90ZW1wbGF0ZXMnLCB0aGlzLmdldFNlc3Npb25UZW1wbGF0ZXMuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy5hcHAuZ2V0KCcvYXBpL3Nlc3Npb24vOnNlc3Npb25JZC90ZW1wbGF0ZS8qJywgdGhpcy5nZXRTZXNzaW9uVGVtcGxhdGUuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgdGhpcy5hcHAucG9zdCgnL2FwaS9zZXNzaW9uLzpzZXNzaW9uSWQvdGVtcGxhdGUvKicsIHRoaXMuc2F2ZVNlc3Npb25UZW1wbGF0ZS5iaW5kKHRoaXMpKTtcclxuICAgICAgICB0aGlzLmFwcC5nZXQoJy9hcGkvc2Vzc2lvbi86c2Vzc2lvbklkL3RlbXBsYXRlLWRhdGEvKicsIHRoaXMuZ2V0U2Vzc2lvblRlbXBsYXRlRGF0YS5iaW5kKHRoaXMpKTtcclxuICAgICAgICB0aGlzLmFwcC5wb3N0KCcvYXBpL3Nlc3Npb24vOnNlc3Npb25JZC9nZW5lcmF0ZS1kb2NzJywgdGhpcy5nZW5lcmF0ZVNlc3Npb25Eb2NzLmJpbmQodGhpcykpO1xyXG4gICAgICAgIHRoaXMuYXBwLnBvc3QoJy9hcGkvc2Vzc2lvbi86c2Vzc2lvbklkL2dlbmVyYXRlJywgdGhpcy5nZW5lcmF0ZVNlc3Npb25Eb2NzLmJpbmQodGhpcykpOyAvLyBBbGlhcyBmb3IgY29tcGF0aWJpbGl0eVxyXG4gICAgICAgIHRoaXMuYXBwLmdldCgnL2FwaS9zZXNzaW9uLzpzZXNzaW9uSWQvY29uZmlnJywgdGhpcy5nZXRTZXNzaW9uQ29uZmlnLmJpbmQodGhpcykpO1xyXG4gICAgICAgIHRoaXMuYXBwLnBvc3QoJy9hcGkvc2Vzc2lvbi86c2Vzc2lvbklkL2NvbmZpZycsIHRoaXMudXBkYXRlU2Vzc2lvbkNvbmZpZy5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgICAgLy8gU2VydmUgc2Vzc2lvbi1zcGVjaWZpYyBnZW5lcmF0ZWQgZG9jdW1lbnRhdGlvblxyXG4gICAgICAgIHRoaXMuYXBwLnVzZSgnL2FwaS9zZXNzaW9uLzpzZXNzaW9uSWQvZG9jcycsIHRoaXMuc2VydmVTZXNzaW9uRG9jcy5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgICAgLy8gU2VydmUgc2Vzc2lvbi1zcGVjaWZpYyBnZW5lcmF0ZWQgZG9jdW1lbnRhdGlvbiBhdCB0aGUgZXhwZWN0ZWQgVVJMIHBhdHRlcm5cclxuICAgICAgICAvLyBUaGVzZSByb3V0ZXMgTVVTVCBjb21lIGJlZm9yZSB0aGUgY2F0Y2gtYWxsIHJvdXRlXHJcbiAgICAgICAgdGhpcy5hcHAuZ2V0KCcvZG9jcy86c2Vzc2lvbklkL2luZGV4Lmh0bWwnLCAocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgIGxvZ2dlci5pbmZvKGDwn5SNIERvY3MgaW5kZXggcm91dGUgaGl0OiAvZG9jcy8ke3JlcS5wYXJhbXMuc2Vzc2lvbklkfS9pbmRleC5odG1sYCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHNlc3Npb25JZCA9IHJlcS5wYXJhbXMuc2Vzc2lvbklkO1xyXG4gICAgICAgICAgICBjb25zdCBzZXNzaW9uID0gdGhpcy5zZXNzaW9ucy5nZXQoc2Vzc2lvbklkKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghc2Vzc2lvbikge1xyXG4gICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKGDinYwgU2Vzc2lvbiBub3QgZm91bmQ6ICR7c2Vzc2lvbklkfWApO1xyXG4gICAgICAgICAgICAgICAgcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBzdWNjZXNzOiBmYWxzZSwgbWVzc2FnZTogJ1Nlc3Npb24gbm90IGZvdW5kJyB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy51cGRhdGVTZXNzaW9uQWN0aXZpdHkoc2Vzc2lvbklkKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGZ1bGxQYXRoID0gcGF0aC5qb2luKHNlc3Npb24uZG9jdW1lbnRhdGlvbkRpciwgJ2luZGV4Lmh0bWwnKTtcclxuICAgICAgICAgICAgbG9nZ2VyLmluZm8oYPCfk4IgTG9va2luZyBmb3IgZmlsZTogJHtmdWxsUGF0aH1gKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGZ1bGxQYXRoKSkge1xyXG4gICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oYOKchSBTZXJ2aW5nIGZpbGU6ICR7ZnVsbFBhdGh9YCk7XHJcbiAgICAgICAgICAgICAgICByZXMuc2VuZEZpbGUoZnVsbFBhdGgpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKGDinYwgRmlsZSBub3QgZm91bmQ6ICR7ZnVsbFBhdGh9YCk7XHJcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzKDQwNCkuc2VuZCgnRG9jdW1lbnRhdGlvbiBmaWxlIG5vdCBmb3VuZCcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIFNlcnZlIGFueSBmaWxlIHdpdGhpbiBzZXNzaW9uIGRvY3VtZW50YXRpb25cclxuICAgICAgICB0aGlzLmFwcC5nZXQoJy9kb2NzLzpzZXNzaW9uSWQvKicsIChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgbG9nZ2VyLmluZm8oYPCflI0gRG9jcyB3aWxkY2FyZCByb3V0ZSBoaXQ6IC9kb2NzLyR7cmVxLnBhcmFtcy5zZXNzaW9uSWR9LyogLSBGaWxlOiAke3JlcS5wYXJhbXNbMF19YCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHNlc3Npb25JZCA9IHJlcS5wYXJhbXMuc2Vzc2lvbklkO1xyXG4gICAgICAgICAgICBjb25zdCBzZXNzaW9uID0gdGhpcy5zZXNzaW9ucy5nZXQoc2Vzc2lvbklkKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghc2Vzc2lvbikge1xyXG4gICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKGDinYwgU2Vzc2lvbiBub3QgZm91bmQ6ICR7c2Vzc2lvbklkfWApO1xyXG4gICAgICAgICAgICAgICAgcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBzdWNjZXNzOiBmYWxzZSwgbWVzc2FnZTogJ1Nlc3Npb24gbm90IGZvdW5kJyB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy51cGRhdGVTZXNzaW9uQWN0aXZpdHkoc2Vzc2lvbklkKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEdldCB0aGUgZmlsZSBwYXRoIGFmdGVyIC9kb2NzL3tzZXNzaW9uSWR9L1xyXG4gICAgICAgICAgICBjb25zdCBmaWxlUGF0aCA9IHJlcS5wYXJhbXNbMF0gfHwgJ2luZGV4Lmh0bWwnO1xyXG4gICAgICAgICAgICBjb25zdCBmdWxsUGF0aCA9IHBhdGguam9pbihzZXNzaW9uLmRvY3VtZW50YXRpb25EaXIsIGZpbGVQYXRoKTtcclxuICAgICAgICAgICAgbG9nZ2VyLmluZm8oYPCfk4IgTG9va2luZyBmb3IgZmlsZTogJHtmdWxsUGF0aH1gKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGZ1bGxQYXRoKSkge1xyXG4gICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oYOKchSBTZXJ2aW5nIGZpbGU6ICR7ZnVsbFBhdGh9YCk7XHJcbiAgICAgICAgICAgICAgICByZXMuc2VuZEZpbGUoZnVsbFBhdGgpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKGDinYwgRmlsZSBub3QgZm91bmQ6ICR7ZnVsbFBhdGh9YCk7XHJcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzKDQwNCkuc2VuZCgnRG9jdW1lbnRhdGlvbiBmaWxlIG5vdCBmb3VuZCcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIEhhbmRsZSBkaXJlY3QgYWNjZXNzIHRvIHNlc3Npb24gZG9jdW1lbnRhdGlvbiByb290IChpbmRleC5odG1sKVxyXG4gICAgICAgIHRoaXMuYXBwLmdldCgnL2RvY3MvOnNlc3Npb25JZCcsIChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgbG9nZ2VyLmluZm8oYPCflI0gRG9jcyByb290IHJvdXRlIGhpdDogL2RvY3MvJHtyZXEucGFyYW1zLnNlc3Npb25JZH1gKTtcclxuICAgICAgICAgICAgY29uc3Qgc2Vzc2lvbklkID0gcmVxLnBhcmFtcy5zZXNzaW9uSWQ7XHJcbiAgICAgICAgICAgIGNvbnN0IHNlc3Npb24gPSB0aGlzLnNlc3Npb25zLmdldChzZXNzaW9uSWQpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFzZXNzaW9uKSB7XHJcbiAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoYOKdjCBTZXNzaW9uIG5vdCBmb3VuZDogJHtzZXNzaW9uSWR9YCk7XHJcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzKDQwNCkuanNvbih7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiAnU2Vzc2lvbiBub3QgZm91bmQnIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVNlc3Npb25BY3Rpdml0eShzZXNzaW9uSWQpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgZnVsbFBhdGggPSBwYXRoLmpvaW4oc2Vzc2lvbi5kb2N1bWVudGF0aW9uRGlyLCAnaW5kZXguaHRtbCcpO1xyXG4gICAgICAgICAgICBsb2dnZXIuaW5mbyhg8J+TgiBMb29raW5nIGZvciBmaWxlOiAke2Z1bGxQYXRofWApO1xyXG5cclxuICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoZnVsbFBhdGgpKSB7XHJcbiAgICAgICAgICAgICAgICBsb2dnZXIuaW5mbyhg4pyFIFNlcnZpbmcgZmlsZTogJHtmdWxsUGF0aH1gKTtcclxuICAgICAgICAgICAgICAgIHJlcy5zZW5kRmlsZShmdWxsUGF0aCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoYOKdjCBGaWxlIG5vdCBmb3VuZDogJHtmdWxsUGF0aH1gKTtcclxuICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoNDA0KS5zZW5kKCdEb2N1bWVudGF0aW9uIGZpbGUgbm90IGZvdW5kJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gU2VydmUgZ2VuZXJhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKGxlZ2FjeSkgLSBNVVNUIGNvbWUgYWZ0ZXIgc2Vzc2lvbi1zcGVjaWZpYyByb3V0ZXNcclxuICAgICAgICAvLyBURU1QT1JBUklMWSBDT01NRU5URUQgT1VUIFRPIFRFU1QgU0VTU0lPTiBST1VURVNcclxuICAgICAgICAvLyB0aGlzLmFwcC51c2UoJy9kb2NzJywgZXhwcmVzcy5zdGF0aWModGhpcy5mYWtlUHJvamVjdFBhdGgpKTsgLy8gU2VydmUgZ2VuZXJhdGVkIGRvY3MgZnJvbSBwbGF5Z3JvdW5kLWRlbW9cclxuXHJcbiAgICAgICAgLy8gU2VydmUgdGhlIG1haW4gcGxheWdyb3VuZCBhcHAgZm9yIHJvb3QgcGF0aCBvbmx5XHJcbiAgICAgICAgdGhpcy5hcHAuZ2V0KCcvJywgKHJlcSwgcmVzKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIFRyeSBkaXN0L3Jlc291cmNlcyBmaXJzdCAocHJvZHVjdGlvbiksIHRoZW4gc3JjL3Jlc291cmNlcyAoZGV2ZWxvcG1lbnQvdGVzdGluZylcclxuICAgICAgICAgICAgY29uc3QgaW5kZXhQYXRoRGlzdCA9IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAnZGlzdC9yZXNvdXJjZXMvdGVtcGxhdGUtcGxheWdyb3VuZC1hcHAvaW5kZXguaHRtbCcpO1xyXG4gICAgICAgICAgICBjb25zdCBpbmRleFBhdGhTcmMgPSBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3NyYy9yZXNvdXJjZXMvdGVtcGxhdGUtcGxheWdyb3VuZC1hcHAvaW5kZXguaHRtbCcpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgY29uc3QgaW5kZXhQYXRoID0gZnMuZXhpc3RzU3luYyhpbmRleFBhdGhEaXN0KSA/IGluZGV4UGF0aERpc3QgOiBpbmRleFBhdGhTcmM7XHJcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGluZGV4UGF0aCkpIHtcclxuICAgICAgICAgICAgICAgIHJlcy5zZW5kRmlsZShpbmRleFBhdGgpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVzLnN0YXR1cyg0MDQpLnNlbmQoJ1RlbXBsYXRlIFBsYXlncm91bmQgbm90IGJ1aWx0LiBQbGVhc2UgcnVuIHRoZSBidWlsZCBwcm9jZXNzLicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIEhhbmRsZSBhbnkgcmVtYWluaW5nIG5vbi1BUEkgcm91dGVzIGJ5IHNlcnZpbmcgdGhlIG1haW4gYXBwIChmb3IgU1BBIHJvdXRpbmcpXHJcbiAgICAgICAgdGhpcy5hcHAuZ2V0KC9eKD8hXFwvYXBpfFxcL3Jlc291cmNlc3xcXC9kb2NzKS4qLywgKHJlcSwgcmVzKSA9PiB7XHJcbiAgICAgICAgICAgIGxvZ2dlci53YXJuKGDimqDvuI8gQ0FUQ0gtQUxMIFJPVVRFIEhJVDogJHtyZXEubWV0aG9kfSAke3JlcS51cmx9YCk7XHJcbiAgICAgICAgICAgIC8vIFRyeSBkaXN0L3Jlc291cmNlcyBmaXJzdCAocHJvZHVjdGlvbiksIHRoZW4gc3JjL3Jlc291cmNlcyAoZGV2ZWxvcG1lbnQvdGVzdGluZylcclxuICAgICAgICAgICAgY29uc3QgaW5kZXhQYXRoRGlzdCA9IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAnZGlzdC9yZXNvdXJjZXMvdGVtcGxhdGUtcGxheWdyb3VuZC1hcHAvaW5kZXguaHRtbCcpO1xyXG4gICAgICAgICAgICBjb25zdCBpbmRleFBhdGhTcmMgPSBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3NyYy9yZXNvdXJjZXMvdGVtcGxhdGUtcGxheWdyb3VuZC1hcHAvaW5kZXguaHRtbCcpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgY29uc3QgaW5kZXhQYXRoID0gZnMuZXhpc3RzU3luYyhpbmRleFBhdGhEaXN0KSA/IGluZGV4UGF0aERpc3QgOiBpbmRleFBhdGhTcmM7XHJcbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGluZGV4UGF0aCkpIHtcclxuICAgICAgICAgICAgICAgIHJlcy5zZW5kRmlsZShpbmRleFBhdGgpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVzLnN0YXR1cyg0MDQpLnNlbmQoJ1RlbXBsYXRlIFBsYXlncm91bmQgbm90IGJ1aWx0LiBQbGVhc2UgcnVuIHRoZSBidWlsZCBwcm9jZXNzLicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRUZW1wbGF0ZXMocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgdGVtcGxhdGVzRGlyID0gcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdkaXN0L3RlbXBsYXRlcy9wYXJ0aWFscycpO1xyXG4gICAgICAgICAgICBjb25zdCBmaWxlcyA9IGF3YWl0IGZzLnJlYWRkaXIodGVtcGxhdGVzRGlyKTtcclxuICAgICAgICAgICAgY29uc3QgdGVtcGxhdGVzID0gZmlsZXNcclxuICAgICAgICAgICAgICAgIC5maWx0ZXIoZmlsZSA9PiBmaWxlLmVuZHNXaXRoKCcuaGJzJykpXHJcbiAgICAgICAgICAgICAgICAubWFwKGZpbGUgPT4gKHtcclxuICAgICAgICAgICAgICAgICAgICBuYW1lOiBmaWxlLnJlcGxhY2UoJy5oYnMnLCAnJyksXHJcbiAgICAgICAgICAgICAgICAgICAgZmlsZW5hbWU6IGZpbGUsXHJcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogcGF0aC5qb2luKHRlbXBsYXRlc0RpciwgZmlsZSlcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgICAgIHJlcy5qc29uKHRlbXBsYXRlcyk7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvciByZWFkaW5nIHRlbXBsYXRlczonLCBlcnJvcik7XHJcbiAgICAgICAgICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHsgZXJyb3I6ICdGYWlsZWQgdG8gcmVhZCB0ZW1wbGF0ZXMnIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGdldFRlbXBsYXRlKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlTmFtZSA9IHJlcS5wYXJhbXMudGVtcGxhdGVOYW1lO1xyXG4gICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZVBhdGggPSBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ2Rpc3QvdGVtcGxhdGVzL3BhcnRpYWxzJywgYCR7dGVtcGxhdGVOYW1lfS5oYnNgKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghYXdhaXQgZnMucGF0aEV4aXN0cyh0ZW1wbGF0ZVBhdGgpKSB7XHJcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzKDQwNCkuanNvbih7IGVycm9yOiAnVGVtcGxhdGUgbm90IGZvdW5kJyB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IGZzLnJlYWRGaWxlKHRlbXBsYXRlUGF0aCwgJ3V0Zi04Jyk7XHJcbiAgICAgICAgICAgIHJlcy5qc29uKHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IHRlbXBsYXRlTmFtZSxcclxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGNvbnRlbnQsXHJcbiAgICAgICAgICAgICAgICBwYXRoOiB0ZW1wbGF0ZVBhdGhcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvciByZWFkaW5nIHRlbXBsYXRlOicsIGVycm9yKTtcclxuICAgICAgICAgICAgcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogJ0ZhaWxlZCB0byByZWFkIHRlbXBsYXRlJyB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRFeGFtcGxlRGF0YShyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBkYXRhVHlwZSA9IHJlcS5wYXJhbXMuZGF0YVR5cGU7XHJcblxyXG4gICAgICAgICAgICAvLyBJbXBvcnQgZXhhbXBsZSBkYXRhIGR5bmFtaWNhbGx5XHJcbiAgICAgICAgICAgIGNvbnN0IHsgRVhBTVBMRV9EQVRBLCBURU1QTEFURV9DT05URVhUIH0gPSBhd2FpdCBpbXBvcnQoJy4vZXhhbXBsZS1kYXRhJyk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIUVYQU1QTEVfREFUQVtkYXRhVHlwZV0pIHtcclxuICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgZXJyb3I6ICdFeGFtcGxlIGRhdGEgdHlwZSBub3QgZm91bmQnIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBXcmFwIGRhdGEgZm9yIHRlbXBsYXRlIGNvbXBhdGliaWxpdHlcclxuICAgICAgICAgICAgY29uc3Qgd3JhcHBlZERhdGEgPSBkYXRhVHlwZSA9PT0gJ2NvbXBvbmVudCcgfHwgZGF0YVR5cGUgPT09ICdkaXJlY3RpdmUnIHx8IGRhdGFUeXBlID09PSAncGlwZScgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFUeXBlID09PSAnZ3VhcmQnIHx8IGRhdGFUeXBlID09PSAnaW50ZXJjZXB0b3InIHx8IGRhdGFUeXBlID09PSAnaW5qZWN0YWJsZScgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFUeXBlID09PSAnY2xhc3MnIHx8IGRhdGFUeXBlID09PSAnaW50ZXJmYWNlJyB8fCBkYXRhVHlwZSA9PT0gJ2VudGl0eScgP1xyXG4gICAgICAgICAgICAgICAgeyBbZGF0YVR5cGVdOiBFWEFNUExFX0RBVEFbZGF0YVR5cGVdLCAuLi5FWEFNUExFX0RBVEFbZGF0YVR5cGVdIH0gOlxyXG4gICAgICAgICAgICAgICAgRVhBTVBMRV9EQVRBW2RhdGFUeXBlXTtcclxuXHJcbiAgICAgICAgICAgIHJlcy5qc29uKHtcclxuICAgICAgICAgICAgICAgIGRhdGE6IHdyYXBwZWREYXRhLFxyXG4gICAgICAgICAgICAgICAgY29udGV4dDogVEVNUExBVEVfQ09OVEVYVFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yIGdldHRpbmcgZXhhbXBsZSBkYXRhOicsIGVycm9yKTtcclxuICAgICAgICAgICAgcmVzLnN0YXR1cyg1MDApLmpzb24oeyBlcnJvcjogJ0ZhaWxlZCB0byBnZXQgZXhhbXBsZSBkYXRhJyB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyByZW5kZXJUZW1wbGF0ZShyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCB7IHRlbXBsYXRlQ29udGVudCwgdGVtcGxhdGVEYXRhLCB0ZW1wbGF0ZUNvbnRleHQgfSA9IHJlcS5ib2R5O1xyXG5cclxuICAgICAgICAgICAgaWYgKCF0ZW1wbGF0ZUNvbnRlbnQpIHtcclxuICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6ICdUZW1wbGF0ZSBjb250ZW50IGlzIHJlcXVpcmVkJyB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gVXNlIHRoZSBwcmUtaW5pdGlhbGl6ZWQgSGFuZGxlYmFycyBpbnN0YW5jZVxyXG4gICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IHRoaXMuaGFuZGxlYmFycy5jb21waWxlKHRlbXBsYXRlQ29udGVudCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlbmRlcmVkID0gdGVtcGxhdGUodGVtcGxhdGVEYXRhIHx8IHt9KTtcclxuXHJcbiAgICAgICAgICAgIHJlcy5qc29uKHsgcmVuZGVyZWQgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvciByZW5kZXJpbmcgdGVtcGxhdGU6JywgZXJyb3IpO1xyXG4gICAgICAgICAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgICAgICAgICAgICBlcnJvcjogJ0ZhaWxlZCB0byByZW5kZXIgdGVtcGxhdGUnLFxyXG4gICAgICAgICAgICAgICAgZGV0YWlsczogZXJyb3IubWVzc2FnZVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyByZW5kZXJDb21wbGV0ZVBhZ2UocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgbGV0IHsgdGVtcGxhdGVDb250ZW50LCB0ZW1wbGF0ZURhdGEsIHRlbXBsYXRlQ29udGV4dCB9ID0gcmVxLmJvZHk7XHJcblxyXG4gICAgICAgICAgICAvLyBIYW5kbGUgZm9ybSBkYXRhIGJ5IHBhcnNpbmcgSlNPTiBzdHJpbmdzXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGVtcGxhdGVEYXRhID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZURhdGEgPSBKU09OLnBhcnNlKHRlbXBsYXRlRGF0YSk7XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVEYXRhID0ge307XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGVtcGxhdGVDb250ZXh0ID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZUNvbnRleHQgPSBKU09OLnBhcnNlKHRlbXBsYXRlQ29udGV4dCk7XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVDb250ZXh0ID0ge307XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICghdGVtcGxhdGVDb250ZW50KSB7XHJcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzKDQwMCkuanNvbih7IGVycm9yOiAnVGVtcGxhdGUgY29udGVudCBpcyByZXF1aXJlZCcgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEdlbmVyYXRlIHByb3BlciBDb21wb2RvYy1zdHlsZSBIVE1MIGRpcmVjdGx5XHJcbiAgICAgICAgICAgIGNvbnN0IHJlbmRlcmVkQ29udGVudCA9IHRoaXMuZ2VuZXJhdGVDb21wb2RvY0h0bWwodGVtcGxhdGVEYXRhIHx8IHt9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIENyZWF0ZSBjb21wbGV0ZSBIVE1MIHBhZ2Ugd2l0aCBDb21wb2RvYyBzdHlsaW5nXHJcbiAgICAgICAgICAgIGNvbnN0IGNvbXBsZXRlUGFnZSA9IGA8IWRvY3R5cGUgaHRtbD5cclxuPGh0bWwgY2xhc3M9XCJuby1qc1wiIGxhbmc9XCJcIj5cclxuICAgIDxoZWFkPlxyXG4gICAgICAgIDxtZXRhIGNoYXJzZXQ9XCJ1dGYtOFwiPlxyXG4gICAgICAgIDxtZXRhIGh0dHAtZXF1aXY9XCJ4LXVhLWNvbXBhdGlibGVcIiBjb250ZW50PVwiaWU9ZWRnZVwiPlxyXG4gICAgICAgIDx0aXRsZT5UZW1wbGF0ZSBQcmV2aWV3IC0gQ29tcG9kb2M8L3RpdGxlPlxyXG4gICAgICAgIDxtZXRhIG5hbWU9XCJkZXNjcmlwdGlvblwiIGNvbnRlbnQ9XCJcIj5cclxuICAgICAgICA8bWV0YSBuYW1lPVwidmlld3BvcnRcIiBjb250ZW50PVwid2lkdGg9ZGV2aWNlLXdpZHRoLCBpbml0aWFsLXNjYWxlPTFcIj5cclxuXHJcbiAgICAgICAgPGxpbmsgcmVsPVwiaWNvblwiIHR5cGU9XCJpbWFnZS94LWljb25cIiBocmVmPVwiL3Jlc291cmNlcy9pbWFnZXMvZmF2aWNvbi5pY29cIj5cclxuICAgICAgICA8bGluayByZWw9XCJzdHlsZXNoZWV0XCIgaHJlZj1cIi9yZXNvdXJjZXMvc3R5bGVzL2Jvb3RzdHJhcC5taW4uY3NzXCI+XHJcbiAgICAgICAgPGxpbmsgcmVsPVwic3R5bGVzaGVldFwiIGhyZWY9XCIvcmVzb3VyY2VzL3N0eWxlcy9jb21wb2RvYy5jc3NcIj5cclxuICAgICAgICA8bGluayByZWw9XCJzdHlsZXNoZWV0XCIgaHJlZj1cIi9yZXNvdXJjZXMvc3R5bGVzL3ByaXNtLmNzc1wiPlxyXG4gICAgICAgIDxsaW5rIHJlbD1cInN0eWxlc2hlZXRcIiBocmVmPVwiL3Jlc291cmNlcy9zdHlsZXMvZGFyay5jc3NcIj5cclxuICAgICAgICA8bGluayByZWw9XCJzdHlsZXNoZWV0XCIgaHJlZj1cIi9yZXNvdXJjZXMvc3R5bGVzL3N0eWxlLmNzc1wiPlxyXG4gICAgPC9oZWFkPlxyXG4gICAgPGJvZHk+XHJcbiAgICAgICAgPHNjcmlwdD5cclxuICAgICAgICAgICAgLy8gQmxvY2tpbmcgc2NyaXB0IHRvIGF2b2lkIGZsaWNrZXJpbmcgZGFyayBtb2RlXHJcbiAgICAgICAgICAgIHZhciB1c2VEYXJrID0gd2luZG93Lm1hdGNoTWVkaWEoJyhwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyayknKTtcclxuICAgICAgICAgICAgdmFyIGRhcmtNb2RlU3RhdGUgPSB1c2VEYXJrLm1hdGNoZXM7XHJcbiAgICAgICAgICAgIHZhciBkYXJrTW9kZVN0YXRlTG9jYWwgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnY29tcG9kb2NfZGFya21vZGUtc3RhdGUnKTtcclxuICAgICAgICAgICAgaWYgKGRhcmtNb2RlU3RhdGVMb2NhbCkge1xyXG4gICAgICAgICAgICAgICAgZGFya01vZGVTdGF0ZSA9IGRhcmtNb2RlU3RhdGVMb2NhbCA9PT0gJ3RydWUnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChkYXJrTW9kZVN0YXRlKSB7XHJcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ2RhcmsnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIDwvc2NyaXB0PlxyXG5cclxuICAgICAgICA8ZGl2IGNsYXNzPVwiY29udGFpbmVyLWZsdWlkIG1haW5cIj5cclxuICAgICAgICAgICAgPCEtLSBTVEFSVCBDT05URU5UIC0tPlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29udGVudCBjb21wb25lbnRcIj5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb250ZW50LWRhdGFcIj5cclxuICAgICAgICAgICAgICAgICAgICAke3JlbmRlcmVkQ29udGVudH1cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPCEtLSBFTkQgQ09OVEVOVCAtLT5cclxuICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgPHNjcmlwdD5cclxuICAgICAgICAgICAgdmFyIENPTVBPRE9DX0NVUlJFTlRfUEFHRV9ERVBUSCA9IDA7XHJcbiAgICAgICAgICAgIHZhciBDT01QT0RPQ19DVVJSRU5UX1BBR0VfQ09OVEVYVCA9ICdjb21wb25lbnQnO1xyXG4gICAgICAgICAgICB2YXIgQ09NUE9ET0NfQ1VSUkVOVF9QQUdFX1VSTCA9ICdjb21wb25lbnQuaHRtbCc7XHJcbiAgICAgICAgPC9zY3JpcHQ+XHJcblxyXG4gICAgICAgIDxzY3JpcHQgc3JjPVwiL3Jlc291cmNlcy9qcy9saWJzL2Jvb3RzdHJhcC1uYXRpdmUuanNcIj48L3NjcmlwdD5cclxuICAgICAgICA8c2NyaXB0IHNyYz1cIi9yZXNvdXJjZXMvanMvbGlicy9wcmlzbS5qc1wiPjwvc2NyaXB0PlxyXG4gICAgICAgIDxzY3JpcHQgc3JjPVwiL3Jlc291cmNlcy9qcy9jb21wb2RvYy5qc1wiPjwvc2NyaXB0PlxyXG4gICAgICAgIDxzY3JpcHQgc3JjPVwiL3Jlc291cmNlcy9qcy90YWJzLmpzXCI+PC9zY3JpcHQ+XHJcbiAgICAgICAgPHNjcmlwdCBzcmM9XCIvcmVzb3VyY2VzL2pzL3NvdXJjZUNvZGUuanNcIj48L3NjcmlwdD5cclxuICAgIDwvYm9keT5cclxuPC9odG1sPmA7XHJcblxyXG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAndGV4dC9odG1sJyk7XHJcbiAgICAgICAgICAgIHJlcy5zZW5kKGNvbXBsZXRlUGFnZSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvciByZW5kZXJpbmcgY29tcGxldGUgcGFnZTonLCBlcnJvcik7XHJcbiAgICAgICAgICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgICAgICAgICAgIGVycm9yOiAnRmFpbGVkIHRvIHJlbmRlciBjb21wbGV0ZSBwYWdlJyxcclxuICAgICAgICAgICAgICAgIGRldGFpbHM6IGVycm9yLm1lc3NhZ2VcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVEb2NzKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgY3VzdG9tVGVtcGxhdGVDb250ZW50LCBtb2NrRGF0YSB9ID0gcmVxLmJvZHk7XHJcblxyXG4gICAgICAgICAgICAvLyBVcGRhdGUgbW9jayBkYXRhIGlmIHByb3ZpZGVkXHJcbiAgICAgICAgICAgIGlmIChtb2NrRGF0YSkge1xyXG4gICAgICAgICAgICAgICAgLy8gVGhpcyBwYXJ0IG9mIHRoZSBsb2dpYyBuZWVkcyB0byBiZSBhZGFwdGVkIHRvIHdvcmsgd2l0aCB0aGUgbmV3IHNlc3Npb24tYmFzZWQgc3lzdGVtXHJcbiAgICAgICAgICAgICAgICAvLyBGb3Igbm93LCB3ZSdsbCBqdXN0IGxvZyB0aGF0IGl0J3Mgbm90IGRpcmVjdGx5IGFwcGxpY2FibGUgaGVyZVxyXG4gICAgICAgICAgICAgICAgbG9nZ2VyLndhcm4oJ21vY2tEYXRhIHBhcmFtZXRlciBpcyBub3QgZGlyZWN0bHkgYXBwbGljYWJsZSBpbiB0aGlzIHNlc3Npb24tYmFzZWQgc3lzdGVtLiBJdCB3aWxsIGJlIGlnbm9yZWQuJyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIENyZWF0ZSBvciBnZXQgc2Vzc2lvbiBmb3IgdGhlIGRvY3VtZW50YXRpb24gZ2VuZXJhdGlvbiBiYXNlZCBvbiBjbGllbnQgSVBcclxuICAgICAgICAgICAgY29uc3QgY2xpZW50SVAgPSB0aGlzLmdldENsaWVudElQKHJlcSk7XHJcbiAgICAgICAgICAgIGNvbnN0IHNlc3Npb24gPSB0aGlzLmNyZWF0ZU9yR2V0U2Vzc2lvbkJ5SVAoY2xpZW50SVApO1xyXG4gICAgICAgICAgICBjb25zdCBzZXNzaW9uSWQgPSBzZXNzaW9uLmlkO1xyXG5cclxuICAgICAgICAgICAgLy8gVXBkYXRlIHNlc3Npb24gY29uZmlnIGlmIGN1c3RvbSB0ZW1wbGF0ZSBjb250ZW50IGlzIHByb3ZpZGVkXHJcbiAgICAgICAgICAgIGlmIChjdXN0b21UZW1wbGF0ZUNvbnRlbnQgJiYgcmVxLmJvZHkudGVtcGxhdGVQYXRoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZVBhdGggPSBwYXRoLmpvaW4oc2Vzc2lvbi50ZW1wbGF0ZURpciwgcmVxLmJvZHkudGVtcGxhdGVQYXRoKTtcclxuICAgICAgICAgICAgICAgIGF3YWl0IGZzLndyaXRlRmlsZSh0ZW1wbGF0ZVBhdGgsIGN1c3RvbVRlbXBsYXRlQ29udGVudCwgJ3V0ZjgnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gR2VuZXJhdGUgZG9jdW1lbnRhdGlvbiBmb3IgdGhlIG5ldyBzZXNzaW9uXHJcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdGVEb2N1bWVudGF0aW9uKHNlc3Npb25JZCwgdHJ1ZSk7IC8vIFVzZSBkZWJvdW5jZVxyXG5cclxuICAgICAgICAgICAgcmVzLmpzb24oeyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiAnRG9jdW1lbnRhdGlvbiBnZW5lcmF0aW9uIGluaXRpYXRlZCBmb3IgYSBuZXcgc2Vzc2lvbicsIHNlc3Npb25JZDogc2Vzc2lvbklkIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGxvZ2dlci5lcnJvcignRXJyb3IgZ2VuZXJhdGluZyBkb2N1bWVudGF0aW9uOicsIGVycm9yKTtcclxuICAgICAgICAgICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICAgICAgICAgICAgZXJyb3I6ICdGYWlsZWQgdG8gZ2VuZXJhdGUgZG9jdW1lbnRhdGlvbicsXHJcbiAgICAgICAgICAgICAgICBkZXRhaWxzOiBlcnJvci5tZXNzYWdlXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHJlZ2lzdGVySGFuZGxlYmFyc0hlbHBlcnMoSGFuZGxlYmFyczogYW55LCBjb250ZXh0OiBhbnkpOiB2b2lkIHtcclxuICAgICAgICAvLyBSZWdpc3RlciB0cmFuc2xhdGlvbiBoZWxwZXIgKG1hdGNoZXMgQ29tcG9kb2MncyBpMThuIGhlbHBlciBwYXR0ZXJuKVxyXG4gICAgICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoJ3QnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1QgSEVMUEVSIENBTExFRCcpO1xyXG4gICAgICAgICAgICBjb25zdCBjb250ZXh0ID0gdGhpcztcclxuICAgICAgICAgICAgY29uc3Qga2V5ID0gYXJndW1lbnRzWzBdO1xyXG4gICAgICAgICAgICBjb25zdCB0cmFuc2xhdGlvbnM6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0gPSB7XHJcbiAgICAgICAgICAgICAgICAnY29tcG9uZW50cyc6ICdDb21wb25lbnRzJyxcclxuICAgICAgICAgICAgICAgICdtb2R1bGVzJzogJ01vZHVsZXMnLFxyXG4gICAgICAgICAgICAgICAgJ2ludGVyZmFjZXMnOiAnSW50ZXJmYWNlcycsXHJcbiAgICAgICAgICAgICAgICAnY2xhc3Nlcyc6ICdDbGFzc2VzJyxcclxuICAgICAgICAgICAgICAgICdpbmplY3RhYmxlcyc6ICdJbmplY3RhYmxlcycsXHJcbiAgICAgICAgICAgICAgICAncGlwZXMnOiAnUGlwZXMnLFxyXG4gICAgICAgICAgICAgICAgJ2RpcmVjdGl2ZXMnOiAnRGlyZWN0aXZlcycsXHJcbiAgICAgICAgICAgICAgICAnZ3VhcmRzJzogJ0d1YXJkcycsXHJcbiAgICAgICAgICAgICAgICAnaW50ZXJjZXB0b3JzJzogJ0ludGVyY2VwdG9ycycsXHJcbiAgICAgICAgICAgICAgICAnZW50aXRpZXMnOiAnRW50aXRpZXMnLFxyXG4gICAgICAgICAgICAgICAgJ2NvbnRyb2xsZXJzJzogJ0NvbnRyb2xsZXJzJyxcclxuICAgICAgICAgICAgICAgICdpbmZvJzogJ0luZm8nLFxyXG4gICAgICAgICAgICAgICAgJ3JlYWRtZSc6ICdSZWFkbWUnLFxyXG4gICAgICAgICAgICAgICAgJ3NvdXJjZSc6ICdTb3VyY2UnLFxyXG4gICAgICAgICAgICAgICAgJ3RlbXBsYXRlJzogJ1RlbXBsYXRlJyxcclxuICAgICAgICAgICAgICAgICdzdHlsZXMnOiAnU3R5bGVzJyxcclxuICAgICAgICAgICAgICAgICdkb20tdHJlZSc6ICdET00gVHJlZScsXHJcbiAgICAgICAgICAgICAgICAnZmlsZSc6ICdGaWxlJyxcclxuICAgICAgICAgICAgICAgICdkZXNjcmlwdGlvbic6ICdEZXNjcmlwdGlvbicsXHJcbiAgICAgICAgICAgICAgICAnaW1wbGVtZW50cyc6ICdJbXBsZW1lbnRzJyxcclxuICAgICAgICAgICAgICAgICdtZXRhZGF0YSc6ICdNZXRhZGF0YScsXHJcbiAgICAgICAgICAgICAgICAnaW5kZXgnOiAnSW5kZXgnLFxyXG4gICAgICAgICAgICAgICAgJ21ldGhvZHMnOiAnTWV0aG9kcycsXHJcbiAgICAgICAgICAgICAgICAncHJvcGVydGllcyc6ICdQcm9wZXJ0aWVzJ1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICByZXR1cm4gdHJhbnNsYXRpb25zW2tleV0gfHwga2V5O1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBSZWdpc3RlciByZWxhdGl2ZSBVUkwgaGVscGVyXHJcbiAgICAgICAgSGFuZGxlYmFycy5yZWdpc3RlckhlbHBlcigncmVsYXRpdmVVUkwnLCAoZGVwdGg6IGFueSwgLi4uYXJnczogYW55W10pID0+IHtcclxuICAgICAgICAgICAgY29uc3QgZGVwdGhWYWx1ZSA9IHR5cGVvZiBkZXB0aCA9PT0gJ251bWJlcicgPyBkZXB0aCA6IChjb250ZXh0LmRlcHRoIHx8IDApO1xyXG4gICAgICAgICAgICBjb25zdCBiYXNlVXJsID0gJy4uLycucmVwZWF0KGRlcHRoVmFsdWUpO1xyXG4gICAgICAgICAgICBjb25zdCBwYXRoQXJncyA9IGFyZ3Muc2xpY2UoMCwgLTEpOyAvLyBSZW1vdmUgSGFuZGxlYmFycyBvcHRpb25zIG9iamVjdFxyXG4gICAgICAgICAgICByZXR1cm4gYmFzZVVybCArIHBhdGhBcmdzLmpvaW4oJy8nKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlZ2lzdGVyIGNvbXBhcmlzb24gaGVscGVyIChtYXRjaGVzIENvbXBvZG9jJ3MgQ29tcGFyZUhlbHBlciBpbXBsZW1lbnRhdGlvbilcclxuICAgICAgICBIYW5kbGViYXJzLnJlZ2lzdGVySGVscGVyKCdjb21wYXJlJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzO1xyXG4gICAgICAgICAgICBjb25zdCBhID0gYXJndW1lbnRzWzBdO1xyXG4gICAgICAgICAgICBjb25zdCBvcGVyYXRvciA9IGFyZ3VtZW50c1sxXTtcclxuICAgICAgICAgICAgY29uc3QgYiA9IGFyZ3VtZW50c1syXTtcclxuICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IGFyZ3VtZW50c1szXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgNCkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdoYW5kbGViYXJzIEhlbHBlciB7e2NvbXBhcmV9fSBleHBlY3RzIDQgYXJndW1lbnRzJyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCByZXN1bHQgPSBmYWxzZTtcclxuICAgICAgICAgICAgc3dpdGNoIChvcGVyYXRvcikge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnaW5kZXhvZic6XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gYi5pbmRleE9mKGEpICE9PSAtMTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJz09PSc6XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gYSA9PT0gYjtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJyE9PSc6XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gYSAhPT0gYjtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJz4nOlxyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGEgPiBiO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnPCc6XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gYSA8IGI7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICc+PSc6XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gYSA+PSBiO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnPD0nOlxyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGEgPD0gYjtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJz09JzpcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBhID09IGI7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICchPSc6XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gYSAhPSBiO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2hlbHBlciB7e2NvbXBhcmV9fTogaW52YWxpZCBvcGVyYXRvcjogYCcgKyBvcGVyYXRvciArICdgJyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChyZXN1bHQgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5pbnZlcnNlKGNvbnRleHQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBvcHRpb25zLmZuKGNvbnRleHQpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBSZWdpc3RlciB0YWIgaGVscGVycyAobWF0Y2hlcyBDb21wb2RvYydzIElzVGFiRW5hYmxlZEhlbHBlciBhbmQgSXNJbml0aWFsVGFiSGVscGVyKVxyXG4gICAgICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoJ2lzVGFiRW5hYmxlZCcsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBjb25zdCBjb250ZXh0ID0gdGhpcztcclxuICAgICAgICAgICAgY29uc3QgbmF2VGFicyA9IGFyZ3VtZW50c1swXTtcclxuICAgICAgICAgICAgY29uc3QgdGFiSWQgPSBhcmd1bWVudHNbMV07XHJcbiAgICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBhcmd1bWVudHNbMl07XHJcblxyXG4gICAgICAgICAgICBjb25zdCBpc0VuYWJsZWQgPSBuYXZUYWJzICYmIG5hdlRhYnMuc29tZSgodGFiOiBhbnkpID0+IHRhYi5pZCA9PT0gdGFiSWQpO1xyXG4gICAgICAgICAgICBpZiAoaXNFbmFibGVkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5mbihjb250ZXh0KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvcHRpb25zLmludmVyc2UoY29udGV4dCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgSGFuZGxlYmFycy5yZWdpc3RlckhlbHBlcignaXNJbml0aWFsVGFiJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbnRleHQgPSB0aGlzO1xyXG4gICAgICAgICAgICBjb25zdCBuYXZUYWJzID0gYXJndW1lbnRzWzBdO1xyXG4gICAgICAgICAgICBjb25zdCB0YWJJZCA9IGFyZ3VtZW50c1sxXTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGlzSW5pdGlhbCA9IG5hdlRhYnMgJiYgbmF2VGFicy5sZW5ndGggPiAwICYmIG5hdlRhYnNbMF0uaWQgPT09IHRhYklkO1xyXG4gICAgICAgICAgICBpZiAoaXNJbml0aWFsKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJ2FjdGl2ZSBpbic7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuICcnO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBSZWdpc3RlciB1dGlsaXR5IGhlbHBlcnNcclxuICAgICAgICBIYW5kbGViYXJzLnJlZ2lzdGVySGVscGVyKCdvckxlbmd0aCcsIGZ1bmN0aW9uKC4uLmFyZ3M6IGFueVtdKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBhcmdzLnBvcCgpO1xyXG4gICAgICAgICAgICBjb25zdCBoYXNMZW5ndGggPSBhcmdzLnNvbWUoYXJnID0+IGFyZyAmJiAoQXJyYXkuaXNBcnJheShhcmcpID8gYXJnLmxlbmd0aCA+IDAgOiBhcmcpKTtcclxuICAgICAgICAgICAgaWYgKGhhc0xlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMuZm4odGhpcyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5pbnZlcnNlKHRoaXMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoJ2JyZWFrQ29tbWEnLCBmdW5jdGlvbihhcnJheTogYW55W10pIHtcclxuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoYXJyYXkpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXJyYXkuam9pbignLCAnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gYXJyYXk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoJ3BhcnNlRGVzY3JpcHRpb24nLCBmdW5jdGlvbihkZXNjcmlwdGlvbjogc3RyaW5nLCBkZXB0aDogbnVtYmVyKSB7XHJcbiAgICAgICAgICAgIC8vIFNpbXBsZSBtYXJrZG93biBwYXJzaW5nIC0ganVzdCByZXR1cm4gYXMgSFRNTCBmb3Igbm93XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgSGFuZGxlYmFycy5TYWZlU3RyaW5nKGRlc2NyaXB0aW9uIHx8ICcnKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgSGFuZGxlYmFycy5yZWdpc3RlckhlbHBlcignZXNjYXBlU2ltcGxlUXVvdGUnLCBmdW5jdGlvbih0ZXh0OiBzdHJpbmcpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB0ZXh0ID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRleHQucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0ZXh0O1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBSZWdpc3RlciBKU0RvYyBoZWxwZXJcclxuICAgICAgICBIYW5kbGViYXJzLnJlZ2lzdGVySGVscGVyKCdqc2RvYy1jb2RlLWV4YW1wbGUnLCBmdW5jdGlvbihqc2RvY3RhZ3M6IGFueVtdLCBvcHRpb25zOiBhbnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMuZm4oeyB0YWdzOiBqc2RvY3RhZ3MgfHwgW10gfSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIFJlZ2lzdGVyIGxpbmstdHlwZSBoZWxwZXIgYXMgYSBzaW1wbGUgcGFydGlhbFxyXG4gICAgICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoJ2xpbmstdHlwZScsIGZ1bmN0aW9uKHR5cGU6IGFueSwgb3B0aW9uczogYW55KSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlICYmIHR5cGUuaHJlZikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBIYW5kbGViYXJzLlNhZmVTdHJpbmcoYDxhIGhyZWY9XCIke3R5cGUuaHJlZn1cIiB0YXJnZXQ9XCIke3R5cGUudGFyZ2V0IHx8ICdfc2VsZid9XCI+JHt0eXBlLnJhdyB8fCB0eXBlfTwvYT5gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdHlwZTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gUmVnaXN0ZXIgYnVpbHQtaW4gYmxvY2sgaGVscGVyc1xyXG4gICAgICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoJ2VhY2gnLCBIYW5kbGViYXJzLmhlbHBlcnMuZWFjaCk7XHJcbiAgICAgICAgSGFuZGxlYmFycy5yZWdpc3RlckhlbHBlcignaWYnLCBIYW5kbGViYXJzLmhlbHBlcnMuaWYpO1xyXG4gICAgICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoJ3VubGVzcycsIEhhbmRsZWJhcnMuaGVscGVycy51bmxlc3MpO1xyXG4gICAgICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoJ3dpdGgnLCBIYW5kbGViYXJzLmhlbHBlcnMud2l0aCk7XHJcblxyXG4gICAgICAgIC8vIFJlZ2lzdGVyIGNvbW1vbiBwYXJ0aWFscyB1c2VkIGluIHRlbXBsYXRlc1xyXG4gICAgICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJQYXJ0aWFsKCdjb21wb25lbnQtZGV0YWlsJywgYFxyXG4gICAgICAgICAgICA8cCBjbGFzcz1cImNvbW1lbnRcIj5cclxuICAgICAgICAgICAgICAgIDxoMz57e3QgXCJmaWxlXCJ9fTwvaDM+XHJcbiAgICAgICAgICAgIDwvcD5cclxuICAgICAgICAgICAgPHAgY2xhc3M9XCJjb21tZW50XCI+XHJcbiAgICAgICAgICAgICAgICA8Y29kZT57e2NvbXBvbmVudC5maWxlfX08L2NvZGU+XHJcbiAgICAgICAgICAgIDwvcD5cclxuXHJcbiAgICAgICAgICAgIHt7I2lmIGNvbXBvbmVudC5kZXNjcmlwdGlvbn19XHJcbiAgICAgICAgICAgICAgICA8cCBjbGFzcz1cImNvbW1lbnRcIj5cclxuICAgICAgICAgICAgICAgICAgICA8aDM+e3t0IFwiZGVzY3JpcHRpb25cIn19PC9oMz5cclxuICAgICAgICAgICAgICAgIDwvcD5cclxuICAgICAgICAgICAgICAgIDxwIGNsYXNzPVwiY29tbWVudFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIHt7e3BhcnNlRGVzY3JpcHRpb24gY29tcG9uZW50LmRlc2NyaXB0aW9uIGRlcHRofX19XHJcbiAgICAgICAgICAgICAgICA8L3A+XHJcbiAgICAgICAgICAgIHt7L2lmfX1cclxuXHJcbiAgICAgICAgICAgIHt7I2lmIGNvbXBvbmVudC5pbXBsZW1lbnRzfX1cclxuICAgICAgICAgICAgICAgIDxwIGNsYXNzPVwiY29tbWVudFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxoMz57e3QgXCJpbXBsZW1lbnRzXCJ9fTwvaDM+XHJcbiAgICAgICAgICAgICAgICA8L3A+XHJcbiAgICAgICAgICAgICAgICA8cCBjbGFzcz1cImNvbW1lbnRcIj5cclxuICAgICAgICAgICAgICAgICAgICB7eyNlYWNoIGNvbXBvbmVudC5pbXBsZW1lbnRzfX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGNvZGU+e3t0aGlzfX08L2NvZGU+e3sjdW5sZXNzIEBsYXN0fX0sIHt7L3VubGVzc319XHJcbiAgICAgICAgICAgICAgICAgICAge3svZWFjaH19XHJcbiAgICAgICAgICAgICAgICA8L3A+XHJcbiAgICAgICAgICAgIHt7L2lmfX1cclxuXHJcbiAgICAgICAgICAgIDxzZWN0aW9uIGRhdGEtY29tcG9kb2M9XCJibG9jay1tZXRhZGF0YVwiPlxyXG4gICAgICAgICAgICAgICAgPGgzPnt7dCBcIm1ldGFkYXRhXCJ9fTwvaDM+XHJcbiAgICAgICAgICAgICAgICA8dGFibGUgY2xhc3M9XCJ0YWJsZSB0YWJsZS1zbSB0YWJsZS1ob3ZlciBtZXRhZGF0YVwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0Ym9keT5cclxuICAgICAgICAgICAgICAgICAgICAgICAge3sjaWYgY29tcG9uZW50LnNlbGVjdG9yfX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwiY29sLW1kLTNcIj5zZWxlY3RvcjwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJjb2wtbWQtOVwiPjxjb2RlPnt7Y29tcG9uZW50LnNlbGVjdG9yfX08L2NvZGU+PC90ZD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cclxuICAgICAgICAgICAgICAgICAgICAgICAge3svaWZ9fVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7eyNpZiBjb21wb25lbnQudGVtcGxhdGVVcmx9fVxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8dHI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJjb2wtbWQtM1wiPnRlbXBsYXRlVXJsPC90ZD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cImNvbC1tZC05XCI+PGNvZGU+e3tjb21wb25lbnQudGVtcGxhdGVVcmx9fTwvY29kZT48L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7ey9pZn19XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHt7I2lmIGNvbXBvbmVudC5zdHlsZVVybHN9fVxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8dHI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJjb2wtbWQtM1wiPnN0eWxlVXJsczwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJjb2wtbWQtOVwiPjxjb2RlPnt7YnJlYWtDb21tYSBjb21wb25lbnQuc3R5bGVVcmxzfX08L2NvZGU+PC90ZD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cclxuICAgICAgICAgICAgICAgICAgICAgICAge3svaWZ9fVxyXG4gICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+XHJcbiAgICAgICAgICAgICAgICA8L3RhYmxlPlxyXG4gICAgICAgICAgICA8L3NlY3Rpb24+XHJcblxyXG4gICAgICAgICAgICB7eyNvckxlbmd0aCBjb21wb25lbnQucHJvcGVydGllcyBjb21wb25lbnQubWV0aG9kcyBjb21wb25lbnQuaW5wdXRzIGNvbXBvbmVudC5vdXRwdXRzfX1cclxuICAgICAgICAgICAgICAgIDxzZWN0aW9uIGRhdGEtY29tcG9kb2M9XCJibG9jay1pbmRleFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxoMyBpZD1cImluZGV4XCI+e3t0IFwiaW5kZXhcIn19PC9oMz5cclxuICAgICAgICAgICAgICAgICAgICA8dGFibGUgY2xhc3M9XCJ0YWJsZSB0YWJsZS1zbSB0YWJsZS1ib3JkZXJlZCBpbmRleC10YWJsZVwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8dGJvZHk+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7eyNpZiBjb21wb25lbnQubWV0aG9kc319XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwiY29sLW1kLTRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGg2PjxiPnt7dCBcIm1ldGhvZHNcIn19PC9iPjwvaDY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwiY29sLW1kLTRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHVsIGNsYXNzPVwiaW5kZXgtbGlzdFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3sjZWFjaCBjb21wb25lbnQubWV0aG9kc319XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGk+PGEgaHJlZj1cIiN7e25hbWV9fVwiPnt7bmFtZX19PC9hPjwvbGk+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7ey9lYWNofX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC91bD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt7L2lmfX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt7I2lmIGNvbXBvbmVudC5wcm9wZXJ0aWVzfX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJjb2wtbWQtNFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aDY+PGI+e3t0IFwicHJvcGVydGllc1wifX08L2I+PC9oNj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJjb2wtbWQtNFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dWwgY2xhc3M9XCJpbmRleC1saXN0XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7eyNlYWNoIGNvbXBvbmVudC5wcm9wZXJ0aWVzfX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI3t7bmFtZX19XCI+e3tuYW1lfX08L2E+PC9saT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt7L2VhY2h9fVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3VsPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge3svaWZ9fVxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L3Rib2R5PlxyXG4gICAgICAgICAgICAgICAgICAgIDwvdGFibGU+XHJcbiAgICAgICAgICAgICAgICA8L3NlY3Rpb24+XHJcbiAgICAgICAgICAgIHt7L29yTGVuZ3RofX1cclxuXHJcbiAgICAgICAgICAgIHt7I2lmIGNvbXBvbmVudC5tZXRob2RzfX1cclxuICAgICAgICAgICAgICAgIDxzZWN0aW9uIGRhdGEtY29tcG9kb2M9XCJibG9jay1tZXRob2RzXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPGgzIGlkPVwibWV0aG9kc1wiPnt7dCBcIm1ldGhvZHNcIn19PC9oMz5cclxuICAgICAgICAgICAgICAgICAgICB7eyNlYWNoIGNvbXBvbmVudC5tZXRob2RzfX1cclxuICAgICAgICAgICAgICAgICAgICA8dGFibGUgY2xhc3M9XCJ0YWJsZSB0YWJsZS1zbSB0YWJsZS1ib3JkZXJlZFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8dGJvZHk+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwiY29sLW1kLTRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgbmFtZT1cInt7bmFtZX19XCI+PC9hPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cIm5hbWVcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPjxiPnt7bmFtZX19PC9iPjwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCIje3tuYW1lfX1cIj48c3BhbiBjbGFzcz1cImljb24gaW9uLWlvcy1saW5rXCI+PC9zcGFuPjwvYT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cImNvbC1tZC00XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxjb2RlPnt7bmFtZX19KHt7I2VhY2ggYXJnc319e3tuYW1lfX06IHt7dHlwZX19e3sjdW5sZXNzIEBsYXN0fX0sIHt7L3VubGVzc319e3svZWFjaH19KTwvY29kZT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt7I2lmIGRlc2NyaXB0aW9ufX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJjb2wtbWQtNFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiaW8tZGVzY3JpcHRpb25cIj57e2Rlc2NyaXB0aW9ufX08L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImlvLWRlc2NyaXB0aW9uXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Yj5SZXR1cm5zIDogPC9iPjxjb2RlPnt7dHlwZX19PC9jb2RlPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt7L2lmfX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cclxuICAgICAgICAgICAgICAgICAgICA8L3RhYmxlPlxyXG4gICAgICAgICAgICAgICAgICAgIHt7L2VhY2h9fVxyXG4gICAgICAgICAgICAgICAgPC9zZWN0aW9uPlxyXG4gICAgICAgICAgICB7ey9pZn19XHJcbiAgICAgICAgYCk7XHJcblxyXG4gICAgICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJQYXJ0aWFsKCdpbmRleCcsICc8IS0tIEluZGV4IHBhcnRpYWwgcGxhY2Vob2xkZXIgLS0+Jyk7XHJcbiAgICAgICAgSGFuZGxlYmFycy5yZWdpc3RlclBhcnRpYWwoJ2xpbmstdHlwZScsICc8Y29kZT57e3R5cGV9fTwvY29kZT4nKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdlbmVyYXRlQ29tcG9kb2NIdG1sKGRhdGE6IGFueSk6IHN0cmluZyB7XHJcbiAgICAgICAgY29uc3QgY29tcG9uZW50ID0gZGF0YS5jb21wb25lbnQgfHwge307XHJcbiAgICAgICAgY29uc3QgbmF2VGFicyA9IGRhdGEubmF2VGFicyB8fCBbXTtcclxuXHJcbiAgICAgICAgLy8gR2VuZXJhdGUgbmF2aWdhdGlvbiB0YWJzXHJcbiAgICAgICAgY29uc3QgdGFic0h0bWwgPSBuYXZUYWJzLm1hcCgodGFiLCBpbmRleCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBpc0FjdGl2ZSA9IGluZGV4ID09PSAwO1xyXG4gICAgICAgICAgICBjb25zdCBhY3RpdmVDbGFzcyA9IGlzQWN0aXZlID8gJ25hdi1saW5rIGFjdGl2ZScgOiAnbmF2LWxpbmsnO1xyXG4gICAgICAgICAgICBjb25zdCBsYWJlbE1hcCA9IHtcclxuICAgICAgICAgICAgICAgICdpbmZvJzogJ0luZm8nLFxyXG4gICAgICAgICAgICAgICAgJ3JlYWRtZSc6ICdSZWFkbWUnLFxyXG4gICAgICAgICAgICAgICAgJ3NvdXJjZSc6ICdTb3VyY2UnLFxyXG4gICAgICAgICAgICAgICAgJ3RlbXBsYXRlJzogJ1RlbXBsYXRlJyxcclxuICAgICAgICAgICAgICAgICdzdHlsZXMnOiAnU3R5bGVzJyxcclxuICAgICAgICAgICAgICAgICdkb20tdHJlZSc6ICdET00gVHJlZSdcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgY29uc3QgbGFiZWwgPSBsYWJlbE1hcFt0YWIubGFiZWxdIHx8IHRhYi5sYWJlbDtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBgICAgICAgICA8bGkgY2xhc3M9XCJuYXYtaXRlbVwiPlxyXG4gICAgICAgICAgICA8YSBocmVmPVwiJHt0YWIuaHJlZn1cIiBjbGFzcz1cIiR7YWN0aXZlQ2xhc3N9XCIgcm9sZT1cInRhYlwiIGlkPVwiJHt0YWIuaWR9LXRhYlwiIGRhdGEtYnMtdG9nZ2xlPVwidGFiXCIgZGF0YS1saW5rPVwiJHt0YWJbJ2RhdGEtbGluayddfVwiPiR7bGFiZWx9PC9hPlxyXG4gICAgICAgIDwvbGk+YDtcclxuICAgICAgICB9KS5qb2luKCdcXG4nKTtcclxuXHJcbiAgICAgICAgLy8gR2VuZXJhdGUgdGFiIGNvbnRlbnRcclxuICAgICAgICBsZXQgdGFiQ29udGVudEh0bWwgPSAnJztcclxuXHJcbiAgICAgICAgLy8gSW5mbyB0YWJcclxuICAgICAgICBpZiAobmF2VGFicy5zb21lKHRhYiA9PiB0YWIuaWQgPT09ICdpbmZvJykpIHtcclxuICAgICAgICAgICAgY29uc3QgaXNBY3RpdmUgPSBuYXZUYWJzWzBdLmlkID09PSAnaW5mbyc7XHJcbiAgICAgICAgICAgIGNvbnN0IGFjdGl2ZUNsYXNzID0gaXNBY3RpdmUgPyAnYWN0aXZlIGluJyA6ICcnO1xyXG5cclxuICAgICAgICAgICAgdGFiQ29udGVudEh0bWwgKz0gYCAgICA8ZGl2IGNsYXNzPVwidGFiLXBhbmUgZmFkZSAke2FjdGl2ZUNsYXNzfVwiIGlkPVwiaW5mb1wiPlxyXG4gICAgICAgIDxwIGNsYXNzPVwiY29tbWVudFwiPlxyXG4gICAgICAgICAgICA8aDM+RmlsZTwvaDM+XHJcbiAgICAgICAgPC9wPlxyXG4gICAgICAgIDxwIGNsYXNzPVwiY29tbWVudFwiPlxyXG4gICAgICAgICAgICA8Y29kZT4ke2NvbXBvbmVudC5maWxlIHx8ICcnfTwvY29kZT5cclxuICAgICAgICA8L3A+XHJcblxyXG4gICAgICAgICR7Y29tcG9uZW50LmRlc2NyaXB0aW9uID8gYFxyXG4gICAgICAgIDxwIGNsYXNzPVwiY29tbWVudFwiPlxyXG4gICAgICAgICAgICA8aDM+RGVzY3JpcHRpb248L2gzPlxyXG4gICAgICAgIDwvcD5cclxuICAgICAgICA8cCBjbGFzcz1cImNvbW1lbnRcIj5cclxuICAgICAgICAgICAgPHA+JHtjb21wb25lbnQuZGVzY3JpcHRpb24ucmVwbGFjZSgvXFxuL2csICc8L3A+XFxuPHA+Jyl9PC9wPlxyXG4gICAgICAgIDwvcD5cclxuICAgICAgICBgIDogJyd9XHJcblxyXG4gICAgICAgICR7Y29tcG9uZW50LmltcGxlbWVudHMgJiYgY29tcG9uZW50LmltcGxlbWVudHMubGVuZ3RoID4gMCA/IGBcclxuICAgICAgICA8cCBjbGFzcz1cImNvbW1lbnRcIj5cclxuICAgICAgICAgICAgPGgzPkltcGxlbWVudHM8L2gzPlxyXG4gICAgICAgIDwvcD5cclxuICAgICAgICA8cCBjbGFzcz1cImNvbW1lbnRcIj5cclxuICAgICAgICAgICAgJHtjb21wb25lbnQuaW1wbGVtZW50cy5tYXAoaW1wbCA9PiBgPGNvZGU+JHtpbXBsfTwvY29kZT5gKS5qb2luKCcsICcpfVxyXG4gICAgICAgIDwvcD5cclxuICAgICAgICBgIDogJyd9XHJcblxyXG4gICAgICAgIDxzZWN0aW9uIGRhdGEtY29tcG9kb2M9XCJibG9jay1tZXRhZGF0YVwiPlxyXG4gICAgICAgICAgICA8aDM+TWV0YWRhdGE8L2gzPlxyXG4gICAgICAgICAgICA8dGFibGUgY2xhc3M9XCJ0YWJsZSB0YWJsZS1zbSB0YWJsZS1ob3ZlciBtZXRhZGF0YVwiPlxyXG4gICAgICAgICAgICAgICAgPHRib2R5PlxyXG4gICAgICAgICAgICAgICAgICAgICR7Y29tcG9uZW50LnNlbGVjdG9yID8gYFxyXG4gICAgICAgICAgICAgICAgICAgIDx0cj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwiY29sLW1kLTNcIj5zZWxlY3RvcjwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cImNvbC1tZC05XCI+PGNvZGU+JHtjb21wb25lbnQuc2VsZWN0b3J9PC9jb2RlPjwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgPC90cj5gIDogJyd9XHJcbiAgICAgICAgICAgICAgICAgICAgJHtjb21wb25lbnQudGVtcGxhdGVVcmwgPyBgXHJcbiAgICAgICAgICAgICAgICAgICAgPHRyPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJjb2wtbWQtM1wiPnRlbXBsYXRlVXJsPC90ZD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwiY29sLW1kLTlcIj48Y29kZT4ke2NvbXBvbmVudC50ZW1wbGF0ZVVybH08L2NvZGU+PC90ZD5cclxuICAgICAgICAgICAgICAgICAgICA8L3RyPmAgOiAnJ31cclxuICAgICAgICAgICAgICAgICAgICAke2NvbXBvbmVudC5zdHlsZVVybHMgJiYgY29tcG9uZW50LnN0eWxlVXJscy5sZW5ndGggPiAwID8gYFxyXG4gICAgICAgICAgICAgICAgICAgIDx0cj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwiY29sLW1kLTNcIj5zdHlsZVVybHM8L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJjb2wtbWQtOVwiPjxjb2RlPiR7Y29tcG9uZW50LnN0eWxlVXJscy5qb2luKCcsICcpfTwvY29kZT48L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvdHI+YCA6ICcnfVxyXG4gICAgICAgICAgICAgICAgPC90Ym9keT5cclxuICAgICAgICAgICAgPC90YWJsZT5cclxuICAgICAgICA8L3NlY3Rpb24+XHJcblxyXG4gICAgICAgICR7Y29tcG9uZW50Lm1ldGhvZHMgJiYgY29tcG9uZW50Lm1ldGhvZHMubGVuZ3RoID4gMCA/IGBcclxuICAgICAgICA8c2VjdGlvbiBkYXRhLWNvbXBvZG9jPVwiYmxvY2staW5kZXhcIj5cclxuICAgICAgICAgICAgPGgzIGlkPVwiaW5kZXhcIj5JbmRleDwvaDM+XHJcbiAgICAgICAgICAgIDx0YWJsZSBjbGFzcz1cInRhYmxlIHRhYmxlLXNtIHRhYmxlLWJvcmRlcmVkIGluZGV4LXRhYmxlXCI+XHJcbiAgICAgICAgICAgICAgICA8dGJvZHk+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRyPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJjb2wtbWQtNFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGg2PjxiPk1ldGhvZHM8L2I+PC9oNj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgICA8L3RyPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0cj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwiY29sLW1kLTRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx1bCBjbGFzcz1cImluZGV4LWxpc3RcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAke2NvbXBvbmVudC5tZXRob2RzLm1hcChtZXRob2QgPT4gYDxsaT48YSBocmVmPVwiIyR7bWV0aG9kLm5hbWV9XCI+JHttZXRob2QubmFtZX08L2E+PC9saT5gKS5qb2luKCdcXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC91bD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgICA8L3RyPlxyXG4gICAgICAgICAgICAgICAgPC90Ym9keT5cclxuICAgICAgICAgICAgPC90YWJsZT5cclxuICAgICAgICA8L3NlY3Rpb24+XHJcblxyXG4gICAgICAgIDxzZWN0aW9uIGRhdGEtY29tcG9kb2M9XCJibG9jay1tZXRob2RzXCI+XHJcbiAgICAgICAgICAgIDxoMyBpZD1cIm1ldGhvZHNcIj5NZXRob2RzPC9oMz5cclxuICAgICAgICAgICAgJHtjb21wb25lbnQubWV0aG9kcy5tYXAobWV0aG9kID0+IGBcclxuICAgICAgICAgICAgPHRhYmxlIGNsYXNzPVwidGFibGUgdGFibGUtc20gdGFibGUtYm9yZGVyZWRcIj5cclxuICAgICAgICAgICAgICAgIDx0Ym9keT5cclxuICAgICAgICAgICAgICAgICAgICA8dHI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cImNvbC1tZC00XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YSBuYW1lPVwiJHttZXRob2QubmFtZX1cIj48L2E+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cIm5hbWVcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj48Yj4ke21ldGhvZC5uYW1lfTwvYj48L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj1cIiMke21ldGhvZC5uYW1lfVwiPjxzcGFuIGNsYXNzPVwiaWNvbiBpb24taW9zLWxpbmtcIj48L3NwYW4+PC9hPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvdHI+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRyPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJjb2wtbWQtNFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGNvZGU+JHttZXRob2QubmFtZX0oKTwvY29kZT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgICA8L3RyPlxyXG4gICAgICAgICAgICAgICAgICAgICR7bWV0aG9kLmRlc2NyaXB0aW9uID8gYFxyXG4gICAgICAgICAgICAgICAgICAgIDx0cj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwiY29sLW1kLTRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJpby1kZXNjcmlwdGlvblwiPiR7bWV0aG9kLmRlc2NyaXB0aW9ufTwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImlvLWRlc2NyaXB0aW9uXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGI+UmV0dXJucyA6IDwvYj48Y29kZT4ke21ldGhvZC50eXBlIHx8ICd2b2lkJ308L2NvZGU+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgICA8L3RyPmAgOiAnJ31cclxuICAgICAgICAgICAgICAgIDwvdGJvZHk+XHJcbiAgICAgICAgICAgIDwvdGFibGU+YCkuam9pbignXFxuICAgICAgICAgICAgJyl9XHJcbiAgICAgICAgPC9zZWN0aW9uPmAgOiAnJ31cclxuICAgIDwvZGl2PlxyXG5gO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gU291cmNlIHRhYlxyXG4gICAgICAgIGlmIChuYXZUYWJzLnNvbWUodGFiID0+IHRhYi5pZCA9PT0gJ3NvdXJjZScpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGlzQWN0aXZlID0gbmF2VGFic1swXS5pZCA9PT0gJ3NvdXJjZSc7XHJcbiAgICAgICAgICAgIGNvbnN0IGFjdGl2ZUNsYXNzID0gaXNBY3RpdmUgPyAnYWN0aXZlIGluJyA6ICcnO1xyXG5cclxuICAgICAgICAgICAgdGFiQ29udGVudEh0bWwgKz0gYCAgICA8ZGl2IGNsYXNzPVwidGFiLXBhbmUgZmFkZSAke2FjdGl2ZUNsYXNzfSB0YWItc291cmNlLWNvZGVcIiBpZD1cInNvdXJjZVwiPlxyXG4gICAgICAgIDxwcmUgY2xhc3M9XCJsaW5lLW51bWJlcnMgY29tcG9kb2Mtc291cmNlY29kZVwiPjxjb2RlIGNsYXNzPVwibGFuZ3VhZ2UtdHlwZXNjcmlwdFwiPiR7Y29tcG9uZW50LnNvdXJjZUNvZGUgfHwgJyd9PC9jb2RlPjwvcHJlPlxyXG4gICAgPC9kaXY+XHJcbmA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBHZW5lcmF0ZSBjb21wbGV0ZSBIVE1MXHJcbiAgICAgICAgcmV0dXJuIGA8b2wgY2xhc3M9XCJicmVhZGNydW1iXCI+XHJcbiAgPGxpIGNsYXNzPVwiYnJlYWRjcnVtYi1pdGVtXCI+Q29tcG9uZW50czwvbGk+XHJcbiAgPGxpIGNsYXNzPVwiYnJlYWRjcnVtYi1pdGVtXCI+JHtjb21wb25lbnQubmFtZSB8fCAnJ308L2xpPlxyXG48L29sPlxyXG5cclxuPHVsIGNsYXNzPVwibmF2IG5hdi10YWJzXCIgcm9sZT1cInRhYmxpc3RcIj5cclxuJHt0YWJzSHRtbH1cclxuPC91bD5cclxuXHJcbjxkaXYgY2xhc3M9XCJ0YWItY29udGVudFwiPlxyXG4ke3RhYkNvbnRlbnRIdG1sfTwvZGl2PmA7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBkb3dubG9hZFRlbXBsYXRlUGFja2FnZShyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCB7IHRlbXBsYXRlVHlwZSwgdGVtcGxhdGVDb250ZW50LCB0ZW1wbGF0ZURhdGEgfSA9IHJlcS5ib2R5O1xyXG5cclxuICAgICAgICAgICAgaWYgKCF0ZW1wbGF0ZVR5cGUgfHwgIXRlbXBsYXRlQ29udGVudCkge1xyXG4gICAgICAgICAgICAgICAgcmVzLnN0YXR1cyg0MDApLmpzb24oeyBlcnJvcjogJ1RlbXBsYXRlIHR5cGUgYW5kIGNvbnRlbnQgYXJlIHJlcXVpcmVkJyB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gQ3JlYXRlIFJFQURNRSBjb250ZW50XHJcbiAgICAgICAgICAgIGNvbnN0IHJlYWRtZSA9IGAjIEN1c3RvbSBDb21wb2RvYyBUZW1wbGF0ZVxyXG5cclxuVGhpcyBwYWNrYWdlIGNvbnRhaW5zIHlvdXIgY3VzdG9taXplZCBDb21wb2RvYyB0ZW1wbGF0ZSBmb3I6ICoqJHt0ZW1wbGF0ZVR5cGV9KipcclxuXHJcbiMjIEZpbGVzIEluY2x1ZGVkXHJcblxyXG4tIFxcYHRlbXBsYXRlcy9wYXJ0aWFscy8ke3RlbXBsYXRlVHlwZX0uaGJzXFxgIC0gWW91ciBtb2RpZmllZCB0ZW1wbGF0ZVxyXG4tIFxcYGV4YW1wbGUtZGF0YS5qc29uXFxgIC0gU2FtcGxlIGRhdGEgc3RydWN0dXJlIGZvciB0ZXN0aW5nXHJcbi0gXFxgUkVBRE1FLm1kXFxgIC0gVGhpcyBmaWxlXHJcblxyXG4jIyBIb3cgdG8gVXNlXHJcblxyXG4jIyMgT3B0aW9uIDE6IFJlcGxhY2UgaW4gZXhpc3RpbmcgQ29tcG9kb2MgaW5zdGFsbGF0aW9uXHJcblxyXG4xLiBCYWNrdXAgeW91ciBvcmlnaW5hbCB0ZW1wbGF0ZSBmaWxlICh1c3VhbGx5IGluIFxcYG5vZGVfbW9kdWxlcy9AY29tcG9kb2MvY29tcG9kb2MvZGlzdC90ZW1wbGF0ZXMvcGFydGlhbHMvJHt0ZW1wbGF0ZVR5cGV9Lmhic1xcYClcclxuMi4gUmVwbGFjZSBpdCB3aXRoIHRoZSBwcm92aWRlZCBcXGAke3RlbXBsYXRlVHlwZX0uaGJzXFxgIGZpbGVcclxuMy4gUmVnZW5lcmF0ZSB5b3VyIGRvY3VtZW50YXRpb24gd2l0aCBDb21wb2RvY1xyXG5cclxuIyMjIE9wdGlvbiAyOiBVc2Ugd2l0aCBjdXN0b20gdGVtcGxhdGUgZGlyZWN0b3J5XHJcblxyXG4xLiBDcmVhdGUgYSBjdXN0b20gdGVtcGxhdGVzIGRpcmVjdG9yeSBpbiB5b3VyIHByb2plY3Q6XHJcbiAgIFxcYFxcYFxcYFxyXG4gICBta2RpciAtcCBjdXN0b20tdGVtcGxhdGVzL3BhcnRpYWxzXHJcbiAgIFxcYFxcYFxcYFxyXG5cclxuMi4gQ29weSB0aGUgXFxgJHt0ZW1wbGF0ZVR5cGV9Lmhic1xcYCBmaWxlIHRvOlxyXG4gICBcXGBcXGBcXGBcclxuICAgY3VzdG9tLXRlbXBsYXRlcy9wYXJ0aWFscy8ke3RlbXBsYXRlVHlwZX0uaGJzXHJcbiAgIFxcYFxcYFxcYFxyXG5cclxuMy4gUnVuIENvbXBvZG9jIHdpdGggdGhlIGN1c3RvbSB0ZW1wbGF0ZSBkaXJlY3Rvcnk6XHJcbiAgIFxcYFxcYFxcYFxyXG4gICBjb21wb2RvYyAtcCB0c2NvbmZpZy5qc29uIC1kIGRvY3VtZW50YXRpb24gLS1jdXN0b21UZW1wbGF0ZSBjdXN0b20tdGVtcGxhdGVzXHJcbiAgIFxcYFxcYFxcYFxyXG5cclxuIyMgVGVtcGxhdGUgVmFyaWFibGVzXHJcblxyXG5UaGUgdGVtcGxhdGUgaGFzIGFjY2VzcyB0byB0aGVzZSBtYWluIHZhcmlhYmxlczpcclxuXHJcbi0gXFxgY29tcG9uZW50XFxgIC0gQ29tcG9uZW50IGluZm9ybWF0aW9uIChuYW1lLCBkZXNjcmlwdGlvbiwgaW5wdXRzLCBvdXRwdXRzLCBldGMuKVxyXG4tIFxcYG5hdlRhYnNcXGAgLSBOYXZpZ2F0aW9uIHRhYnMgY29uZmlndXJhdGlvblxyXG4tIFxcYGRlcHRoXFxgIC0gQ3VycmVudCBwYWdlIGRlcHRoIGZvciByZWxhdGl2ZSBVUkxzXHJcbi0gXFxgdFxcYCAtIFRyYW5zbGF0aW9uIGhlbHBlciBmdW5jdGlvblxyXG5cclxuRm9yIGEgY29tcGxldGUgbGlzdCBvZiBhdmFpbGFibGUgdmFyaWFibGVzLCBzZWUgdGhlIFxcYGV4YW1wbGUtZGF0YS5qc29uXFxgIGZpbGUuXHJcblxyXG4jIyBOZWVkIEhlbHA/XHJcblxyXG4tIENvbXBvZG9jIERvY3VtZW50YXRpb246IGh0dHBzOi8vY29tcG9kb2MuYXBwL1xyXG4tIEdpdEh1YiBJc3N1ZXM6IGh0dHBzOi8vZ2l0aHViLmNvbS9jb21wb2RvYy9jb21wb2RvYy9pc3N1ZXNcclxuXHJcbkdlbmVyYXRlZCBieSBDb21wb2RvYyBUZW1wbGF0ZSBQbGF5Z3JvdW5kIG9uICR7bmV3IERhdGUoKS50b0xvY2FsZVN0cmluZygpfVxyXG5gO1xyXG5cclxuICAgICAgICAgICAgLy8gQ3JlYXRlIGV4YW1wbGUgZGF0YVxyXG4gICAgICAgICAgICBjb25zdCBleGFtcGxlRGF0YSA9IHtcclxuICAgICAgICAgICAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZVR5cGUsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1RoaXMgaXMgc2FtcGxlIGRhdGEgdGhhdCBtYXRjaGVzIHRoZSBzdHJ1Y3R1cmUgdXNlZCBpbiBDb21wb2RvYyB0ZW1wbGF0ZXMnLFxyXG4gICAgICAgICAgICAgICAgZGF0YTogdGVtcGxhdGVEYXRhIHx8IHt9XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAvLyBDcmVhdGUgWklQIHN0cnVjdHVyZSBhcyBKU09OICh0byBiZSBwcm9jZXNzZWQgYnkgZnJvbnRlbmQpXHJcbiAgICAgICAgICAgIGNvbnN0IHppcFN0cnVjdHVyZSA9IHtcclxuICAgICAgICAgICAgICAgIFtgdGVtcGxhdGVzL3BhcnRpYWxzLyR7dGVtcGxhdGVUeXBlfS5oYnNgXTogdGVtcGxhdGVDb250ZW50LFxyXG4gICAgICAgICAgICAgICAgJ1JFQURNRS5tZCc6IHJlYWRtZSxcclxuICAgICAgICAgICAgICAgICdleGFtcGxlLWRhdGEuanNvbic6IEpTT04uc3RyaW5naWZ5KGV4YW1wbGVEYXRhLCBudWxsLCAyKVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgcmVzLmpzb24oe1xyXG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIGZpbGVuYW1lOiBgY29tcG9kb2MtJHt0ZW1wbGF0ZVR5cGV9LXRlbXBsYXRlLnppcGAsXHJcbiAgICAgICAgICAgICAgICBmaWxlczogemlwU3RydWN0dXJlXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yIGNyZWF0aW5nIHRlbXBsYXRlIHBhY2thZ2U6JywgZXJyb3IpO1xyXG4gICAgICAgICAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgICAgICAgICAgICBlcnJvcjogJ0ZhaWxlZCB0byBjcmVhdGUgdGVtcGxhdGUgcGFja2FnZScsXHJcbiAgICAgICAgICAgICAgICBkZXRhaWxzOiBlcnJvci5tZXNzYWdlXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGRvd25sb2FkU2Vzc2lvblRlbXBsYXRlWmlwKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgc2Vzc2lvbklkIH0gPSByZXEucGFyYW1zO1xyXG4gICAgICAgICAgICBjb25zdCB7IHRlbXBsYXRlUGF0aCwgdGVtcGxhdGVDb250ZW50IH0gPSByZXEuYm9keTtcclxuXHJcbiAgICAgICAgICAgIGlmICghdGVtcGxhdGVQYXRoIHx8ICF0ZW1wbGF0ZUNvbnRlbnQpIHtcclxuICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgZXJyb3I6ICdUZW1wbGF0ZSBwYXRoIGFuZCBjb250ZW50IGFyZSByZXF1aXJlZCcgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHNlc3Npb24gPSB0aGlzLnNlc3Npb25zLmdldChzZXNzaW9uSWQpO1xyXG4gICAgICAgICAgICBpZiAoIXNlc3Npb24pIHtcclxuICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6ICdTZXNzaW9uIG5vdCBmb3VuZCcgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU2Vzc2lvbkFjdGl2aXR5KHNlc3Npb25JZCk7XHJcblxyXG4gICAgICAgICAgICAvLyBFeHRyYWN0IHRlbXBsYXRlIG5hbWUgZnJvbSBwYXRoXHJcbiAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlTmFtZSA9IHBhdGguYmFzZW5hbWUodGVtcGxhdGVQYXRoLCAnLmhicycpO1xyXG4gICAgICAgICAgICBjb25zdCBmaWxlTmFtZSA9IGBjb21wb2RvYy0ke3RlbXBsYXRlTmFtZX0tdGVtcGxhdGUuemlwYDtcclxuXHJcbiAgICAgICAgICAgIC8vIFNldCByZXNwb25zZSBoZWFkZXJzIGZvciBmaWxlIGRvd25sb2FkXHJcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi96aXAnKTtcclxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1EaXNwb3NpdGlvbicsIGBhdHRhY2htZW50OyBmaWxlbmFtZT1cIiR7ZmlsZU5hbWV9XCJgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBaSVAgYXJjaGl2ZSBhbmQgaGFuZGxlIGl0IHdpdGggcHJvcGVyIHByb21pc2VcclxuICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYXJjaGl2ZSA9IGFyY2hpdmVyKCd6aXAnLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgemxpYjogeyBsZXZlbDogOSB9IC8vIE1heGltdW0gY29tcHJlc3Npb25cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEhhbmRsZSBhcmNoaXZlIGV2ZW50c1xyXG4gICAgICAgICAgICAgICAgYXJjaGl2ZS5vbignZXJyb3InLCAoZXJyKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdBcmNoaXZlIGVycm9yOicsIGVycik7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihgRmFpbGVkIHRvIGNyZWF0ZSBaSVAgZmlsZTogJHtlcnIubWVzc2FnZX1gKSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBhcmNoaXZlLm9uKCdlbmQnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oYOKchSBUZW1wbGF0ZSBaSVAgY3JlYXRlZCBzdWNjZXNzZnVsbHkgZm9yIHNlc3Npb24gJHtzZXNzaW9uSWR9OiAke2ZpbGVOYW1lfWApO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFBpcGUgYXJjaGl2ZSB0byByZXNwb25zZVxyXG4gICAgICAgICAgICAgICAgYXJjaGl2ZS5waXBlKHJlcyk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQWRkIHRlbXBsYXRlIGZpbGUgdG8gWklQXHJcbiAgICAgICAgICAgICAgICBhcmNoaXZlLmFwcGVuZCh0ZW1wbGF0ZUNvbnRlbnQsIHsgbmFtZTogYHRlbXBsYXRlcy9wYXJ0aWFscy8ke3RlbXBsYXRlTmFtZX0uaGJzYCB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgUkVBRE1FIGNvbnRlbnRcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlYWRtZSA9IGAjIEN1c3RvbSBDb21wb2RvYyBUZW1wbGF0ZVxyXG5cclxuVGhpcyBwYWNrYWdlIGNvbnRhaW5zIHlvdXIgY3VzdG9taXplZCBDb21wb2RvYyB0ZW1wbGF0ZSBmb3I6ICoqJHt0ZW1wbGF0ZU5hbWV9KipcclxuXHJcbiMjIEZpbGVzIEluY2x1ZGVkXHJcblxyXG4tIFxcYHRlbXBsYXRlcy9wYXJ0aWFscy8ke3RlbXBsYXRlTmFtZX0uaGJzXFxgIC0gWW91ciBtb2RpZmllZCB0ZW1wbGF0ZVxyXG4tIFxcYGV4YW1wbGUtZGF0YS5qc29uXFxgIC0gU2FtcGxlIGRhdGEgc3RydWN0dXJlIGZvciB0ZXN0aW5nXHJcbi0gXFxgUkVBRE1FLm1kXFxgIC0gVGhpcyBmaWxlXHJcblxyXG4jIyBIb3cgdG8gVXNlXHJcblxyXG4jIyMgT3B0aW9uIDE6IFJlcGxhY2UgaW4gZXhpc3RpbmcgQ29tcG9kb2MgaW5zdGFsbGF0aW9uXHJcblxyXG4xLiBCYWNrdXAgeW91ciBvcmlnaW5hbCB0ZW1wbGF0ZSBmaWxlICh1c3VhbGx5IGluIFxcYG5vZGVfbW9kdWxlcy9AY29tcG9kb2MvY29tcG9kb2MvZGlzdC90ZW1wbGF0ZXMvcGFydGlhbHMvJHt0ZW1wbGF0ZU5hbWV9Lmhic1xcYClcclxuMi4gUmVwbGFjZSBpdCB3aXRoIHRoZSBwcm92aWRlZCBcXGAke3RlbXBsYXRlTmFtZX0uaGJzXFxgIGZpbGVcclxuMy4gUmVnZW5lcmF0ZSB5b3VyIGRvY3VtZW50YXRpb24gd2l0aCBDb21wb2RvY1xyXG5cclxuIyMjIE9wdGlvbiAyOiBVc2Ugd2l0aCBjdXN0b20gdGVtcGxhdGUgZGlyZWN0b3J5XHJcblxyXG4xLiBDcmVhdGUgYSBjdXN0b20gdGVtcGxhdGVzIGRpcmVjdG9yeSBpbiB5b3VyIHByb2plY3Q6XHJcbiAgIFxcYFxcYFxcYFxyXG4gICBta2RpciAtcCBjdXN0b20tdGVtcGxhdGVzL3BhcnRpYWxzXHJcbiAgIFxcYFxcYFxcYFxyXG5cclxuMi4gQ29weSB0aGUgXFxgJHt0ZW1wbGF0ZU5hbWV9Lmhic1xcYCBmaWxlIHRvOlxyXG4gICBcXGBcXGBcXGBcclxuICAgY3VzdG9tLXRlbXBsYXRlcy9wYXJ0aWFscy8ke3RlbXBsYXRlTmFtZX0uaGJzXHJcbiAgIFxcYFxcYFxcYFxyXG5cclxuMy4gUnVuIENvbXBvZG9jIHdpdGggdGhlIGN1c3RvbSB0ZW1wbGF0ZSBkaXJlY3Rvcnk6XHJcbiAgIFxcYFxcYFxcYFxyXG4gICBjb21wb2RvYyAtcCB0c2NvbmZpZy5qc29uIC1kIGRvY3VtZW50YXRpb24gLS1jdXN0b21UZW1wbGF0ZSBjdXN0b20tdGVtcGxhdGVzXHJcbiAgIFxcYFxcYFxcYFxyXG5cclxuIyMgVGVtcGxhdGUgVmFyaWFibGVzXHJcblxyXG5UaGUgdGVtcGxhdGUgaGFzIGFjY2VzcyB0byB0aGVzZSBtYWluIHZhcmlhYmxlczpcclxuXHJcbi0gXFxgY29tcG9uZW50XFxgIC0gQ29tcG9uZW50IGluZm9ybWF0aW9uIChuYW1lLCBkZXNjcmlwdGlvbiwgaW5wdXRzLCBvdXRwdXRzLCBldGMuKVxyXG4tIFxcYG5hdlRhYnNcXGAgLSBOYXZpZ2F0aW9uIHRhYnMgY29uZmlndXJhdGlvblxyXG4tIFxcYGRlcHRoXFxgIC0gQ3VycmVudCBwYWdlIGRlcHRoIGZvciByZWxhdGl2ZSBVUkxzXHJcbi0gXFxgdFxcYCAtIFRyYW5zbGF0aW9uIGhlbHBlciBmdW5jdGlvblxyXG5cclxuRm9yIGEgY29tcGxldGUgbGlzdCBvZiBhdmFpbGFibGUgdmFyaWFibGVzLCBzZWUgdGhlIFxcYGV4YW1wbGUtZGF0YS5qc29uXFxgIGZpbGUuXHJcblxyXG4jIyBOZWVkIEhlbHA/XHJcblxyXG4tIENvbXBvZG9jIERvY3VtZW50YXRpb246IGh0dHBzOi8vY29tcG9kb2MuYXBwL1xyXG4tIEdpdEh1YiBJc3N1ZXM6IGh0dHBzOi8vZ2l0aHViLmNvbS9jb21wb2RvYy9jb21wb2RvYy9pc3N1ZXNcclxuXHJcbkdlbmVyYXRlZCBieSBDb21wb2RvYyBUZW1wbGF0ZSBQbGF5Z3JvdW5kIG9uICR7bmV3IERhdGUoKS50b0xvY2FsZVN0cmluZygpfVxyXG5gO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEFkZCBSRUFETUUgdG8gWklQXHJcbiAgICAgICAgICAgICAgICBhcmNoaXZlLmFwcGVuZChyZWFkbWUsIHsgbmFtZTogJ1JFQURNRS5tZCcgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gVHJ5IHRvIGdldCB0ZW1wbGF0ZSBkYXRhIGZvciB0aGUgY3VycmVudCBzZXNzaW9uIGFuZCB0ZW1wbGF0ZVxyXG4gICAgICAgICAgICAgICAgdGhpcy5nZXRTZXNzaW9uVGVtcGxhdGVEYXRhSW50ZXJuYWwoc2Vzc2lvbklkLCB0ZW1wbGF0ZVBhdGgpXHJcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4odGVtcGxhdGVEYXRhUmVzcG9uc2UgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBleGFtcGxlRGF0YSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZU5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1RoaXMgaXMgc2FtcGxlIGRhdGEgdGhhdCBtYXRjaGVzIHRoZSBzdHJ1Y3R1cmUgdXNlZCBpbiBDb21wb2RvYyB0ZW1wbGF0ZXMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogdGVtcGxhdGVEYXRhUmVzcG9uc2UgfHwge31cclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXJjaGl2ZS5hcHBlbmQoSlNPTi5zdHJpbmdpZnkoZXhhbXBsZURhdGEsIG51bGwsIDIpLCB7IG5hbWU6ICdleGFtcGxlLWRhdGEuanNvbicgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICAuY2F0Y2goZGF0YUVycm9yID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLndhcm4oJ0NvdWxkIG5vdCBnZXQgdGVtcGxhdGUgZGF0YSwgdXNpbmcgYmFzaWMgc3RydWN0dXJlOicsIGRhdGFFcnJvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGJhc2ljRGF0YSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZU5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1RoaXMgaXMgc2FtcGxlIGRhdGEgdGhhdCBtYXRjaGVzIHRoZSBzdHJ1Y3R1cmUgdXNlZCBpbiBDb21wb2RvYyB0ZW1wbGF0ZXMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogeyBub3RlOiAnVGVtcGxhdGUgZGF0YSBjb3VsZCBub3QgYmUgbG9hZGVkJyB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyY2hpdmUuYXBwZW5kKEpTT04uc3RyaW5naWZ5KGJhc2ljRGF0YSwgbnVsbCwgMiksIHsgbmFtZTogJ2V4YW1wbGUtZGF0YS5qc29uJyB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmluYWxpemUgdGhlIGFyY2hpdmUgYWZ0ZXIgYWRkaW5nIGFsbCBmaWxlc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmNoaXZlLmZpbmFsaXplKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yIGNyZWF0aW5nIHNlc3Npb24gdGVtcGxhdGUgWklQOicsIGVycm9yKTtcclxuICAgICAgICAgICAgaWYgKCFyZXMuaGVhZGVyc1NlbnQpIHtcclxuICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogJ0ZhaWxlZCB0byBjcmVhdGUgdGVtcGxhdGUgWklQJyxcclxuICAgICAgICAgICAgICAgICAgICBkZXRhaWxzOiBlcnJvci5tZXNzYWdlXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGRvd25sb2FkQWxsU2Vzc2lvblRlbXBsYXRlcyhyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCB7IHNlc3Npb25JZCB9ID0gcmVxLnBhcmFtcztcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHNlc3Npb24gPSB0aGlzLnNlc3Npb25zLmdldChzZXNzaW9uSWQpO1xyXG4gICAgICAgICAgICBpZiAoIXNlc3Npb24pIHtcclxuICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6ICdTZXNzaW9uIG5vdCBmb3VuZCcgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU2Vzc2lvbkFjdGl2aXR5KHNlc3Npb25JZCk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBmaWxlTmFtZSA9IGBjb21wb2RvYy10ZW1wbGF0ZXMtJHtzZXNzaW9uSWR9LnppcGA7XHJcblxyXG4gICAgICAgICAgICAvLyBDcmVhdGUgWklQIGFyY2hpdmUgaW4gbWVtb3J5IGZvciBzdXBlcnRlc3QgY29tcGF0aWJpbGl0eVxyXG4gICAgICAgICAgICBjb25zdCB6aXBCdWZmZXIgPSBhd2FpdCBuZXcgUHJvbWlzZTxCdWZmZXI+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGFyY2hpdmUgPSBhcmNoaXZlcignemlwJywge1xyXG4gICAgICAgICAgICAgICAgICAgIHpsaWI6IHsgbGV2ZWw6IDkgfSAvLyBNYXhpbXVtIGNvbXByZXNzaW9uXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBjaHVua3M6IEJ1ZmZlcltdID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gSGFuZGxlIGFyY2hpdmUgZXZlbnRzXHJcbiAgICAgICAgICAgICAgICBhcmNoaXZlLm9uKCdlcnJvcicsIChlcnIpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0FyY2hpdmUgZXJyb3I6JywgZXJyKTtcclxuICAgICAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKGBGYWlsZWQgdG8gY3JlYXRlIFpJUCBmaWxlOiAke2Vyci5tZXNzYWdlfWApKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGFyY2hpdmUub24oJ2RhdGEnLCAoY2h1bmspID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjaHVua3MucHVzaChjaHVuayk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBhcmNoaXZlLm9uKCdlbmQnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oYOKchSBBbGwgdGVtcGxhdGVzIFpJUCBjcmVhdGVkIHN1Y2Nlc3NmdWxseSBmb3Igc2Vzc2lvbiAke3Nlc3Npb25JZH06ICR7ZmlsZU5hbWV9YCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYnVmZmVyID0gQnVmZmVyLmNvbmNhdChjaHVua3MpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoYnVmZmVyKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEFkZCBhbGwgZmlsZXMgZnJvbSB0aGUgc2Vzc2lvbidzIHRlbXBsYXRlIGRpcmVjdG9yeVxyXG4gICAgICAgICAgICAgICAgLy8gVGhpcyBtYWludGFpbnMgdGhlIHNhbWUgc3RydWN0dXJlIGFzIGhicy10ZW1wbGF0ZXMtY29weS08aGFzaD5cclxuICAgICAgICAgICAgICAgIGFyY2hpdmUuZGlyZWN0b3J5KHNlc3Npb24udGVtcGxhdGVEaXIsIGZhbHNlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgYSBjb21wcmVoZW5zaXZlIFJFQURNRVxyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVhZG1lID0gYCMgQ29tcG9kb2MgVGVtcGxhdGUgUGFja2FnZVxyXG5cclxuVGhpcyBwYWNrYWdlIGNvbnRhaW5zIGFsbCBjdXN0b21pemVkIENvbXBvZG9jIHRlbXBsYXRlcyBmb3Igc2Vzc2lvbjogKioke3Nlc3Npb25JZH0qKlxyXG5cclxuIyMgU3RydWN0dXJlXHJcblxyXG5UaGlzIHRlbXBsYXRlIHBhY2thZ2UgaGFzIHRoZSBzYW1lIHN0cnVjdHVyZSBhcyBDb21wb2RvYydzIGRlZmF1bHQgdGVtcGxhdGVzOlxyXG5cclxuLSBcXGBwYWdlLmhic1xcYCAtIE1haW4gcGFnZSB0ZW1wbGF0ZVxyXG4tIFxcYHBhcnRpYWxzL1xcYCAtIERpcmVjdG9yeSBjb250YWluaW5nIGFsbCBwYXJ0aWFsIHRlbXBsYXRlczpcclxuICAtIENvbXBvbmVudCB0ZW1wbGF0ZXMgKFxcYGNvbXBvbmVudC5oYnNcXGAsIFxcYGRpcmVjdGl2ZS5oYnNcXGAsIGV0Yy4pXHJcbiAgLSBCbG9jayB0ZW1wbGF0ZXMgKFxcYGJsb2NrLSouaGJzXFxgKVxyXG4gIC0gTGF5b3V0IHRlbXBsYXRlcyAoXFxgbWVudS5oYnNcXGAsIFxcYGluZGV4Lmhic1xcYCwgZXRjLilcclxuICAtIFV0aWxpdHkgdGVtcGxhdGVzIChcXGBzZWFyY2gtKi5oYnNcXGAsIFxcYGNvdmVyYWdlLSouaGJzXFxgLCBldGMuKVxyXG5cclxuIyMgSG93IHRvIFVzZVxyXG5cclxuIyMjIE9wdGlvbiAxOiBSZXBsYWNlIGVudGlyZSB0ZW1wbGF0ZSBkaXJlY3RvcnlcclxuXHJcbjEuIEJhY2t1cCB5b3VyIG9yaWdpbmFsIHRlbXBsYXRlcyBkaXJlY3RvcnkgKHVzdWFsbHkgaW4gXFxgbm9kZV9tb2R1bGVzL0Bjb21wb2RvYy9jb21wb2RvYy9kaXN0L3RlbXBsYXRlcy9cXGApXHJcbjIuIFJlcGxhY2UgaXQgd2l0aCB0aGUgY29udGVudHMgb2YgdGhpcyBaSVAgZmlsZVxyXG4zLiBSZWdlbmVyYXRlIHlvdXIgZG9jdW1lbnRhdGlvbiB3aXRoIENvbXBvZG9jXHJcblxyXG4jIyMgT3B0aW9uIDI6IFVzZSB3aXRoIGN1c3RvbSB0ZW1wbGF0ZSBkaXJlY3RvcnlcclxuXHJcbjEuIEV4dHJhY3QgdGhpcyBaSVAgdG8gYSBkaXJlY3RvcnkgaW4geW91ciBwcm9qZWN0IChlLmcuLCBcXGBjdXN0b20tdGVtcGxhdGVzL1xcYClcclxuMi4gUnVuIENvbXBvZG9jIHdpdGggdGhlIGN1c3RvbSB0ZW1wbGF0ZSBkaXJlY3Rvcnk6XHJcbiAgIFxcYFxcYFxcYFxyXG4gICBjb21wb2RvYyAtcCB0c2NvbmZpZy5qc29uIC1kIGRvY3VtZW50YXRpb24gLS1jdXN0b21UZW1wbGF0ZSBjdXN0b20tdGVtcGxhdGVzXHJcbiAgIFxcYFxcYFxcYFxyXG5cclxuIyMjIE9wdGlvbiAzOiBVc2Ugc3BlY2lmaWMgdGVtcGxhdGVzIG9ubHlcclxuXHJcbjEuIEV4dHJhY3Qgb25seSB0aGUgdGVtcGxhdGVzIHlvdSB3YW50IHRvIGN1c3RvbWl6ZVxyXG4yLiBQbGFjZSB0aGVtIGluIHlvdXIgY3VzdG9tIHRlbXBsYXRlIGRpcmVjdG9yeSBtYWludGFpbmluZyB0aGUgc2FtZSBzdHJ1Y3R1cmVcclxuMy4gQ29tcG9kb2Mgd2lsbCB1c2UgeW91ciBjdXN0b20gdGVtcGxhdGVzIGFuZCBmYWxsIGJhY2sgdG8gZGVmYXVsdHMgZm9yIG90aGVyc1xyXG5cclxuIyMgVGVtcGxhdGUgVmFyaWFibGVzXHJcblxyXG5UZW1wbGF0ZXMgaGF2ZSBhY2Nlc3MgdG8gY29tcHJlaGVuc2l2ZSBkYXRhIHN0cnVjdHVyZXMgaW5jbHVkaW5nOlxyXG5cclxuLSBDb21wb25lbnQvRGlyZWN0aXZlL1NlcnZpY2UgaW5mb3JtYXRpb25cclxuLSBOYXZpZ2F0aW9uIGFuZCByb3V0aW5nIGRhdGFcclxuLSBEb2N1bWVudGF0aW9uIG1ldGFkYXRhXHJcbi0gQ29uZmlndXJhdGlvbiBvcHRpb25zXHJcbi0gSGVscGVyIGZ1bmN0aW9ucyBmb3IgZm9ybWF0dGluZyBhbmQgbmF2aWdhdGlvblxyXG5cclxuIyMgTmVlZCBIZWxwP1xyXG5cclxuLSBDb21wb2RvYyBEb2N1bWVudGF0aW9uOiBodHRwczovL2NvbXBvZG9jLmFwcC9cclxuLSBHaXRIdWIgSXNzdWVzOiBodHRwczovL2dpdGh1Yi5jb20vY29tcG9kb2MvY29tcG9kb2MvaXNzdWVzXHJcbi0gVGVtcGxhdGUgRG9jdW1lbnRhdGlvbjogaHR0cHM6Ly9jb21wb2RvYy5hcHAvZ3VpZGVzL3RlbXBsYXRlcy5odG1sXHJcblxyXG5HZW5lcmF0ZWQgYnkgQ29tcG9kb2MgVGVtcGxhdGUgUGxheWdyb3VuZCBvbiAke25ldyBEYXRlKCkudG9Mb2NhbGVTdHJpbmcoKX1cclxuYDtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBBZGQgUkVBRE1FIHRvIFpJUCByb290XHJcbiAgICAgICAgICAgICAgICBhcmNoaXZlLmFwcGVuZChyZWFkbWUsIHsgbmFtZTogJ1JFQURNRS5tZCcgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gRmluYWxpemUgdGhlIGFyY2hpdmUgYWZ0ZXIgYWRkaW5nIGFsbCBmaWxlc1xyXG4gICAgICAgICAgICAgICAgYXJjaGl2ZS5maW5hbGl6ZSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIFNldCBoZWFkZXJzIGFuZCBzZW5kIGJ1ZmZlciByZXNwb25zZSBmb3Igc3VwZXJ0ZXN0IGNvbXBhdGliaWxpdHlcclxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL3ppcCcpO1xyXG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LURpc3Bvc2l0aW9uJywgYGF0dGFjaG1lbnQ7IGZpbGVuYW1lPVwiJHtmaWxlTmFtZX1cImApO1xyXG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LUxlbmd0aCcsIHppcEJ1ZmZlci5sZW5ndGgudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBGb3IgdGVzdGluZywgYWxzbyBhZGQgYSBjdXN0b20gaGVhZGVyIHdpdGggdGhlIHNpemVcclxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignWC1Db250ZW50LVNpemUnLCB6aXBCdWZmZXIubGVuZ3RoLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmVzLmVuZCh6aXBCdWZmZXIsICdiaW5hcnknKTtcclxuXHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvciBjcmVhdGluZyBhbGwgdGVtcGxhdGVzIFpJUDonLCBlcnJvcik7XHJcbiAgICAgICAgICAgIGlmICghcmVzLmhlYWRlcnNTZW50KSB7XHJcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6ICdGYWlsZWQgdG8gY3JlYXRlIGFsbCB0ZW1wbGF0ZXMgWklQJyxcclxuICAgICAgICAgICAgICAgICAgICBkZXRhaWxzOiBlcnJvci5tZXNzYWdlXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGdldFNlc3Npb25UZW1wbGF0ZURhdGFJbnRlcm5hbChzZXNzaW9uSWQ6IHN0cmluZywgdGVtcGxhdGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIC8vIEludGVybmFsIG1ldGhvZCB0byBnZXQgdGVtcGxhdGUgZGF0YSB3aXRob3V0IEhUVFAgcmVxdWVzdC9yZXNwb25zZVxyXG4gICAgICAgIGlmICghdGhpcy5zZXNzaW9ucy5oYXMoc2Vzc2lvbklkKSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Nlc3Npb24gbm90IGZvdW5kJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnVwZGF0ZVNlc3Npb25BY3Rpdml0eShzZXNzaW9uSWQpO1xyXG5cclxuICAgICAgICBjb25zdCB0ZW1wbGF0ZU5hbWUgPSBwYXRoLmJhc2VuYW1lKHRlbXBsYXRlUGF0aCwgJy5oYnMnKTtcclxuICAgICAgICBsZXQgZGF0YSA9IHt9O1xyXG5cclxuICAgICAgICBpZiAodGVtcGxhdGVOYW1lLmluY2x1ZGVzKCdjb21wb25lbnQnKSkge1xyXG4gICAgICAgICAgICBkYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ0V4YW1wbGVDb21wb25lbnQnLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBIHNhbXBsZSBBbmd1bGFyIGNvbXBvbmVudCBmb3IgZGVtb25zdHJhdGlvbicsXHJcbiAgICAgICAgICAgICAgICBmaWxlOiAnc3JjL2FwcC9leGFtcGxlLmNvbXBvbmVudC50cycsXHJcbiAgICAgICAgICAgICAgICBzZWxlY3RvcjogJ2FwcC1leGFtcGxlJyxcclxuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnLi9leGFtcGxlLmNvbXBvbmVudC5odG1sJyxcclxuICAgICAgICAgICAgICAgIHN0eWxlVXJsczogWycuL2V4YW1wbGUuY29tcG9uZW50LnNjc3MnXSxcclxuICAgICAgICAgICAgICAgIGlucHV0czogW1xyXG4gICAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ3RpdGxlJywgdHlwZTogJ3N0cmluZycsIGRlc2NyaXB0aW9uOiAnQ29tcG9uZW50IHRpdGxlJyB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ2VuYWJsZWQnLCB0eXBlOiAnYm9vbGVhbicsIGRlc2NyaXB0aW9uOiAnV2hldGhlciBjb21wb25lbnQgaXMgZW5hYmxlZCcgfVxyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIG91dHB1dHM6IFtcclxuICAgICAgICAgICAgICAgICAgICB7IG5hbWU6ICdjbGlja2VkJywgdHlwZTogJ0V2ZW50RW1pdHRlcjx2b2lkPicsIGRlc2NyaXB0aW9uOiAnRW1pdHRlZCB3aGVuIGNsaWNrZWQnIH1cclxuICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9IGVsc2UgaWYgKHRlbXBsYXRlTmFtZS5pbmNsdWRlcygnc2VydmljZScpIHx8IHRlbXBsYXRlTmFtZS5pbmNsdWRlcygnaW5qZWN0YWJsZScpKSB7XHJcbiAgICAgICAgICAgIGRhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnRXhhbXBsZVNlcnZpY2UnLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBIHNhbXBsZSBBbmd1bGFyIHNlcnZpY2UgZm9yIGRlbW9uc3RyYXRpb24nLFxyXG4gICAgICAgICAgICAgICAgZmlsZTogJ3NyYy9hcHAvZXhhbXBsZS5zZXJ2aWNlLnRzJyxcclxuICAgICAgICAgICAgICAgIG1ldGhvZHM6IFtcclxuICAgICAgICAgICAgICAgICAgICB7IG5hbWU6ICdnZXREYXRhJywgcmV0dXJuVHlwZTogJ09ic2VydmFibGU8YW55PicsIGRlc2NyaXB0aW9uOiAnR2V0cyBkYXRhIGZyb20gQVBJJyB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ3NhdmVEYXRhJywgcmV0dXJuVHlwZTogJ3ZvaWQnLCBkZXNjcmlwdGlvbjogJ1NhdmVzIGRhdGEgdG8gc3RvcmFnZScgfVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGRhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBgRXhhbXBsZSR7dGVtcGxhdGVOYW1lLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgdGVtcGxhdGVOYW1lLnNsaWNlKDEpfWAsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogYEEgc2FtcGxlICR7dGVtcGxhdGVOYW1lfSBmb3IgZGVtb25zdHJhdGlvbmAsXHJcbiAgICAgICAgICAgICAgICBmaWxlOiBgc3JjL2FwcC9leGFtcGxlLiR7dGVtcGxhdGVOYW1lfS50c2BcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBkYXRhO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFNlc3Npb24gbWFuYWdlbWVudCBBUEkgbWV0aG9kc1xyXG4gICAgcHJpdmF0ZSBhc3luYyBjcmVhdGVTZXNzaW9uQVBJKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNsaWVudElQID0gdGhpcy5nZXRDbGllbnRJUChyZXEpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gSW4gdGVzdCBlbnZpcm9ubWVudCBvciBpZiBmb3JjZU5ldyBxdWVyeSBwYXJhbSBpcyBzZXQsIGFsd2F5cyBjcmVhdGUgbmV3IHNlc3Npb25cclxuICAgICAgICAgICAgLy8gT3RoZXJ3aXNlIHJldXNlIHNlc3Npb24gYnkgSVAgZm9yIG5vcm1hbCB1c2FnZVxyXG4gICAgICAgICAgICBjb25zdCBmb3JjZU5ldyA9IHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAndGVzdCcgfHwgcmVxLnF1ZXJ5LmZvcmNlTmV3ID09PSAndHJ1ZSc7XHJcbiAgICAgICAgICAgIGNvbnN0IHNlc3Npb24gPSBmb3JjZU5ldyA/IHRoaXMuY3JlYXRlTmV3U2Vzc2lvbihjbGllbnRJUCkgOiB0aGlzLmNyZWF0ZU9yR2V0U2Vzc2lvbkJ5SVAoY2xpZW50SVApO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgcmVzLmpzb24oe1xyXG4gICAgICAgICAgICAgICAgc2Vzc2lvbklkOiBzZXNzaW9uLmlkLFxyXG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdTZXNzaW9uIGNyZWF0ZWQgc3VjY2Vzc2Z1bGx5JyxcclxuICAgICAgICAgICAgICAgIGlwOiBjbGllbnRJUFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yIGNyZWF0aW5nIHNlc3Npb246JywgZXJyb3IpO1xyXG4gICAgICAgICAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdGYWlsZWQgdG8gY3JlYXRlIHNlc3Npb24nLFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGdldFNlc3Npb25UZW1wbGF0ZXMocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3Qgc2Vzc2lvbklkID0gcmVxLnBhcmFtcy5zZXNzaW9uSWQ7XHJcbiAgICAgICAgICAgIGNvbnN0IHNlc3Npb24gPSB0aGlzLnNlc3Npb25zLmdldChzZXNzaW9uSWQpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFzZXNzaW9uKSB7XHJcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzKDQwNCkuanNvbih7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiAnU2Vzc2lvbiBub3QgZm91bmQnIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVNlc3Npb25BY3Rpdml0eShzZXNzaW9uSWQpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgdGVtcGxhdGVzOiBhbnlbXSA9IFtdO1xyXG4gICAgICAgICAgICBjb25zdCBwYXJ0aWFsc0RpciA9IHBhdGguam9pbihzZXNzaW9uLnRlbXBsYXRlRGlyLCAncGFydGlhbHMnKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFJlYWQgbWFpbiB0ZW1wbGF0ZVxyXG4gICAgICAgICAgICBjb25zdCBtYWluVGVtcGxhdGVQYXRoID0gcGF0aC5qb2luKHNlc3Npb24udGVtcGxhdGVEaXIsICdwYWdlLmhicycpO1xyXG4gICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhtYWluVGVtcGxhdGVQYXRoKSkge1xyXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdwYWdlLmhicycsXHJcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogJ3BhZ2UuaGJzJyxcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAndGVtcGxhdGUnXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gUmVhZCBwYXJ0aWFsc1xyXG4gICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhwYXJ0aWFsc0RpcikpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHBhcnRpYWxGaWxlcyA9IGZzLnJlYWRkaXJTeW5jKHBhcnRpYWxzRGlyKS5maWx0ZXIoZmlsZSA9PiBmaWxlLmVuZHNXaXRoKCcuaGJzJykpO1xyXG4gICAgICAgICAgICAgICAgcGFydGlhbEZpbGVzLmZvckVhY2goZmlsZSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBmaWxlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiBgcGFydGlhbHMvJHtmaWxlfWAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdwYXJ0aWFsJ1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJlcy5qc29uKHsgdGVtcGxhdGVzLCBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGxvZ2dlci5lcnJvcignRXJyb3IgZ2V0dGluZyBzZXNzaW9uIHRlbXBsYXRlczonLCBlcnJvcik7XHJcbiAgICAgICAgICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ0ZhaWxlZCB0byBnZXQgdGVtcGxhdGVzJyxcclxuICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRTZXNzaW9uVGVtcGxhdGUocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgeyBzZXNzaW9uSWQgfSA9IHJlcS5wYXJhbXM7XHJcbiAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlTmFtZSA9IHJlcS5wYXJhbXNbMF07XHJcbiAgICAgICAgICAgIGNvbnN0IHNlc3Npb24gPSB0aGlzLnNlc3Npb25zLmdldChzZXNzaW9uSWQpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFzZXNzaW9uKSB7XHJcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzKDQwNCkuanNvbih7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiAnU2Vzc2lvbiBub3QgZm91bmQnIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVNlc3Npb25BY3Rpdml0eShzZXNzaW9uSWQpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgdGVtcGxhdGVQYXRoID0gcGF0aC5qb2luKHNlc3Npb24udGVtcGxhdGVEaXIsIHRlbXBsYXRlTmFtZSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmModGVtcGxhdGVQYXRoKSkge1xyXG4gICAgICAgICAgICAgICAgcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBzdWNjZXNzOiBmYWxzZSwgbWVzc2FnZTogJ1RlbXBsYXRlIG5vdCBmb3VuZCcgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmModGVtcGxhdGVQYXRoLCAndXRmOCcpO1xyXG4gICAgICAgICAgICByZXMuanNvbih7XHJcbiAgICAgICAgICAgICAgICBjb250ZW50LFxyXG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHRlbXBsYXRlTmFtZSxcclxuICAgICAgICAgICAgICAgIHBhdGg6IHRlbXBsYXRlTmFtZVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yIGdldHRpbmcgc2Vzc2lvbiB0ZW1wbGF0ZTonLCBlcnJvcik7XHJcbiAgICAgICAgICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ0ZhaWxlZCB0byBnZXQgdGVtcGxhdGUnLFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHNhdmVTZXNzaW9uVGVtcGxhdGUocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgeyBzZXNzaW9uSWQgfSA9IHJlcS5wYXJhbXM7XHJcbiAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlTmFtZSA9IHJlcS5wYXJhbXNbMF07XHJcbiAgICAgICAgICAgIGNvbnN0IHsgY29udGVudCB9ID0gcmVxLmJvZHk7XHJcbiAgICAgICAgICAgIGNvbnN0IHNlc3Npb24gPSB0aGlzLnNlc3Npb25zLmdldChzZXNzaW9uSWQpO1xyXG5cclxuICAgICAgICAgICAgLy8gVmFsaWRhdGUgcmVxdWlyZWQgcGFyYW1ldGVyc1xyXG4gICAgICAgICAgICBpZiAoIWNvbnRlbnQgfHwgdHlwZW9mIGNvbnRlbnQgIT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzKDQwMCkuanNvbih7IFxyXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLCBcclxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnQ29udGVudCBpcyByZXF1aXJlZCBhbmQgbXVzdCBiZSBhIHN0cmluZycgXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCF0ZW1wbGF0ZU5hbWUpIHtcclxuICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoNDAwKS5qc29uKHsgXHJcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsIFxyXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdUZW1wbGF0ZSBuYW1lIGlzIHJlcXVpcmVkJyBcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIXNlc3Npb24pIHtcclxuICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6ICdTZXNzaW9uIG5vdCBmb3VuZCcgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU2Vzc2lvbkFjdGl2aXR5KHNlc3Npb25JZCk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZVBhdGggPSBwYXRoLmpvaW4oc2Vzc2lvbi50ZW1wbGF0ZURpciwgdGVtcGxhdGVOYW1lKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEVuc3VyZSBkaXJlY3RvcnkgZXhpc3RzXHJcbiAgICAgICAgICAgIGZzLmVuc3VyZURpclN5bmMocGF0aC5kaXJuYW1lKHRlbXBsYXRlUGF0aCkpO1xyXG5cclxuICAgICAgICAgICAgLy8gU2F2ZSB0aGUgdGVtcGxhdGUgY29udGVudFxyXG4gICAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jKHRlbXBsYXRlUGF0aCwgY29udGVudCwgJ3V0ZjgnKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFRyaWdnZXIgZGVib3VuY2VkIGRvY3VtZW50YXRpb24gcmVnZW5lcmF0aW9uXHJcbiAgICAgICAgICAgIHRoaXMuZ2VuZXJhdGVEb2N1bWVudGF0aW9uKHNlc3Npb25JZCwgdHJ1ZSk7XHJcblxyXG4gICAgICAgICAgICByZXMuanNvbih7XHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ1RlbXBsYXRlIHNhdmVkIHN1Y2Nlc3NmdWxseScsXHJcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZU5hbWVcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvciBzYXZpbmcgc2Vzc2lvbiB0ZW1wbGF0ZTonLCBlcnJvcik7XHJcbiAgICAgICAgICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ0ZhaWxlZCB0byBzYXZlIHRlbXBsYXRlJyxcclxuICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRTZXNzaW9uVGVtcGxhdGVEYXRhKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgc2Vzc2lvbklkIH0gPSByZXEucGFyYW1zO1xyXG4gICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZVBhdGggPSByZXEucGFyYW1zWzBdO1xyXG5cclxuICAgICAgICAgICAgaWYgKCF0aGlzLnNlc3Npb25zLmhhcyhzZXNzaW9uSWQpKSB7XHJcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzKDQwNCkuanNvbih7XHJcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ1Nlc3Npb24gbm90IGZvdW5kJ1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU2Vzc2lvbkFjdGl2aXR5KHNlc3Npb25JZCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHNlc3Npb24gPSB0aGlzLnNlc3Npb25zLmdldChzZXNzaW9uSWQpO1xyXG5cclxuICAgICAgICAgICAgLy8gR2V0IGV4YW1wbGUgZGF0YSBmb3IgdGhlIHRlbXBsYXRlIHR5cGVcclxuICAgICAgICAgICAgY29uc3QgdGVtcGxhdGVOYW1lID0gcGF0aC5iYXNlbmFtZSh0ZW1wbGF0ZVBhdGgsICcuaGJzJyk7XHJcblxyXG4gICAgICAgICAgICAvLyAqKkNPTVBPRE9DIENPTkZJR1VSQVRJT04gT1BUSU9OUyoqXHJcbiAgICAgICAgICAgIC8vIFJldHVybiBvbmx5IGFjdHVhbCBDb21wb2RvYyBjb25maWd1cmF0aW9uIG9wdGlvbnMgdGhhdCBjYW4gYmUgZWRpdGVkXHJcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvZG9jQ29uZmlnID0ge1xyXG4gICAgICAgICAgICAgICAgLy8gRG9jdW1lbnRhdGlvbiBNZXRhZGF0YVxyXG4gICAgICAgICAgICAgICAgbmFtZTogc2Vzc2lvbj8uY29uZmlnPy5uYW1lIHx8ICdBcHBsaWNhdGlvbiBkb2N1bWVudGF0aW9uJyxcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBQYXRocyBhbmQgT3V0cHV0XHJcbiAgICAgICAgICAgICAgICBvdXRwdXQ6IHNlc3Npb24/LmNvbmZpZz8ub3V0cHV0IHx8ICcuL2RvY3VtZW50YXRpb24vJyxcclxuICAgICAgICAgICAgICAgIHRoZW1lOiBzZXNzaW9uPy5jb25maWc/LnRoZW1lIHx8ICdnaXRib29rJyxcclxuICAgICAgICAgICAgICAgIGxhbmd1YWdlOiBzZXNzaW9uPy5jb25maWc/Lmxhbmd1YWdlIHx8ICdlbi1VUycsXHJcbiAgICAgICAgICAgICAgICBiYXNlOiBzZXNzaW9uPy5jb25maWc/LmJhc2UgfHwgJy8nLFxyXG5cclxuICAgICAgICAgICAgICAgIC8vIEFzc2V0cyBhbmQgQ3VzdG9tIFVJXHJcbiAgICAgICAgICAgICAgICBjdXN0b21GYXZpY29uOiBzZXNzaW9uPy5jb25maWc/LmN1c3RvbUZhdmljb24gfHwgJycsXHJcbiAgICAgICAgICAgICAgICBjdXN0b21Mb2dvOiBzZXNzaW9uPy5jb25maWc/LmN1c3RvbUxvZ28gfHwgJycsXHJcbiAgICAgICAgICAgICAgICBhc3NldHNGb2xkZXI6IHNlc3Npb24/LmNvbmZpZz8uYXNzZXRzRm9sZGVyIHx8ICcnLFxyXG4gICAgICAgICAgICAgICAgZXh0VGhlbWU6IHNlc3Npb24/LmNvbmZpZz8uZXh0VGhlbWUgfHwgJycsXHJcblxyXG4gICAgICAgICAgICAgICAgLy8gRmVhdHVyZSBUb2dnbGVzIC0gRGlzYWJsZSBPcHRpb25zXHJcbiAgICAgICAgICAgICAgICBkaXNhYmxlU291cmNlQ29kZTogc2Vzc2lvbj8uY29uZmlnPy5kaXNhYmxlU291cmNlQ29kZSB8fCBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGRpc2FibGVHcmFwaDogc2Vzc2lvbj8uY29uZmlnPy5kaXNhYmxlR3JhcGggfHwgZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBkaXNhYmxlQ292ZXJhZ2U6IHNlc3Npb24/LmNvbmZpZz8uZGlzYWJsZUNvdmVyYWdlIHx8IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgZGlzYWJsZVByaXZhdGU6IHNlc3Npb24/LmNvbmZpZz8uZGlzYWJsZVByaXZhdGUgfHwgZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBkaXNhYmxlUHJvdGVjdGVkOiBzZXNzaW9uPy5jb25maWc/LmRpc2FibGVQcm90ZWN0ZWQgfHwgZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBkaXNhYmxlSW50ZXJuYWw6IHNlc3Npb24/LmNvbmZpZz8uZGlzYWJsZUludGVybmFsIHx8IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgZGlzYWJsZUxpZmVDeWNsZUhvb2tzOiBzZXNzaW9uPy5jb25maWc/LmRpc2FibGVMaWZlQ3ljbGVIb29rcyB8fCBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGRpc2FibGVDb25zdHJ1Y3RvcnM6IHNlc3Npb24/LmNvbmZpZz8uZGlzYWJsZUNvbnN0cnVjdG9ycyB8fCBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGRpc2FibGVSb3V0ZXNHcmFwaDogc2Vzc2lvbj8uY29uZmlnPy5kaXNhYmxlUm91dGVzR3JhcGggfHwgZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBkaXNhYmxlU2VhcmNoOiBzZXNzaW9uPy5jb25maWc/LmRpc2FibGVTZWFyY2ggfHwgZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBkaXNhYmxlRGVwZW5kZW5jaWVzOiBzZXNzaW9uPy5jb25maWc/LmRpc2FibGVEZXBlbmRlbmNpZXMgfHwgZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBkaXNhYmxlUHJvcGVydGllczogc2Vzc2lvbj8uY29uZmlnPy5kaXNhYmxlUHJvcGVydGllcyB8fCBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGRpc2FibGVEb21UcmVlOiBzZXNzaW9uPy5jb25maWc/LmRpc2FibGVEb21UcmVlIHx8IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgZGlzYWJsZVRlbXBsYXRlVGFiOiBzZXNzaW9uPy5jb25maWc/LmRpc2FibGVUZW1wbGF0ZVRhYiB8fCBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGRpc2FibGVTdHlsZVRhYjogc2Vzc2lvbj8uY29uZmlnPy5kaXNhYmxlU3R5bGVUYWIgfHwgZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBkaXNhYmxlTWFpbkdyYXBoOiBzZXNzaW9uPy5jb25maWc/LmRpc2FibGVNYWluR3JhcGggfHwgZmFsc2UsXHJcblxyXG4gICAgICAgICAgICAgICAgLy8gVUkgT3B0aW9uc1xyXG4gICAgICAgICAgICAgICAgaGlkZUdlbmVyYXRvcjogc2Vzc2lvbj8uY29uZmlnPy5oaWRlR2VuZXJhdG9yIHx8IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgaGlkZURhcmtNb2RlVG9nZ2xlOiBzZXNzaW9uPy5jb25maWc/LmhpZGVEYXJrTW9kZVRvZ2dsZSB8fCBmYWxzZSxcclxuICAgICAgICAgICAgICAgIG1pbmltYWw6IHNlc3Npb24/LmNvbmZpZz8ubWluaW1hbCB8fCBmYWxzZSxcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBBZGRpdGlvbmFsIENvbnRlbnRcclxuICAgICAgICAgICAgICAgIGluY2x1ZGVzOiBzZXNzaW9uPy5jb25maWc/LmluY2x1ZGVzIHx8ICcnLFxyXG4gICAgICAgICAgICAgICAgaW5jbHVkZXNOYW1lOiBzZXNzaW9uPy5jb25maWc/LmluY2x1ZGVzTmFtZSB8fCAnQWRkaXRpb25hbCBkb2N1bWVudGF0aW9uJyxcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBTZXJ2aW5nIE9wdGlvbnNcclxuICAgICAgICAgICAgICAgIHBvcnQ6IHNlc3Npb24/LmNvbmZpZz8ucG9ydCB8fCA4MDgwLFxyXG4gICAgICAgICAgICAgICAgaG9zdG5hbWU6IHNlc3Npb24/LmNvbmZpZz8uaG9zdG5hbWUgfHwgJzEyNy4wLjAuMScsXHJcbiAgICAgICAgICAgICAgICBzZXJ2ZTogc2Vzc2lvbj8uY29uZmlnPy5zZXJ2ZSB8fCBmYWxzZSxcclxuICAgICAgICAgICAgICAgIG9wZW46IHNlc3Npb24/LmNvbmZpZz8ub3BlbiB8fCBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHdhdGNoOiBzZXNzaW9uPy5jb25maWc/LndhdGNoIHx8IGZhbHNlLFxyXG5cclxuICAgICAgICAgICAgICAgIC8vIEV4cG9ydCBPcHRpb25zXHJcbiAgICAgICAgICAgICAgICBleHBvcnRGb3JtYXQ6IHNlc3Npb24/LmNvbmZpZz8uZXhwb3J0Rm9ybWF0IHx8ICdodG1sJyxcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBDb3ZlcmFnZSBPcHRpb25zXHJcbiAgICAgICAgICAgICAgICBjb3ZlcmFnZVRlc3Q6IHNlc3Npb24/LmNvbmZpZz8uY292ZXJhZ2VUZXN0IHx8IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgY292ZXJhZ2VUZXN0VGhyZXNob2xkOiBzZXNzaW9uPy5jb25maWc/LmNvdmVyYWdlVGVzdFRocmVzaG9sZCB8fCA3MCxcclxuICAgICAgICAgICAgICAgIGNvdmVyYWdlTWluaW11bVBlckZpbGU6IHNlc3Npb24/LmNvbmZpZz8uY292ZXJhZ2VNaW5pbXVtUGVyRmlsZSB8fCAwLFxyXG4gICAgICAgICAgICAgICAgY292ZXJhZ2VUZXN0VGhyZXNob2xkRmFpbDogc2Vzc2lvbj8uY29uZmlnPy5jb3ZlcmFnZVRlc3RUaHJlc2hvbGRGYWlsIHx8IHRydWUsXHJcbiAgICAgICAgICAgICAgICBjb3ZlcmFnZVRlc3RTaG93T25seUZhaWxlZDogc2Vzc2lvbj8uY29uZmlnPy5jb3ZlcmFnZVRlc3RTaG93T25seUZhaWxlZCB8fCBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHVuaXRUZXN0Q292ZXJhZ2U6IHNlc3Npb24/LmNvbmZpZz8udW5pdFRlc3RDb3ZlcmFnZSB8fCAnJyxcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBHb29nbGUgQW5hbHl0aWNzXHJcbiAgICAgICAgICAgICAgICBnYUlEOiBzZXNzaW9uPy5jb25maWc/LmdhSUQgfHwgJycsXHJcbiAgICAgICAgICAgICAgICBnYVNpdGU6IHNlc3Npb24/LmNvbmZpZz8uZ2FTaXRlIHx8ICdhdXRvJyxcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBBZHZhbmNlZCBPcHRpb25zXHJcbiAgICAgICAgICAgICAgICBzaWxlbnQ6IHNlc3Npb24/LmNvbmZpZz8uc2lsZW50IHx8IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgbWF4U2VhcmNoUmVzdWx0czogc2Vzc2lvbj8uY29uZmlnPy5tYXhTZWFyY2hSZXN1bHRzIHx8IDE1LFxyXG5cclxuICAgICAgICAgICAgICAgIC8vIE1lbnUgQ29uZmlndXJhdGlvbiAoYXMgSlNPTiBzdHJpbmcgZm9yIGVkaXRpbmcpXHJcbiAgICAgICAgICAgICAgICB0b2dnbGVNZW51SXRlbXM6IEpTT04uc3RyaW5naWZ5KHNlc3Npb24/LmNvbmZpZz8udG9nZ2xlTWVudUl0ZW1zIHx8IFsnYWxsJ10pLFxyXG4gICAgICAgICAgICAgICAgbmF2VGFiQ29uZmlnOiBKU09OLnN0cmluZ2lmeShzZXNzaW9uPy5jb25maWc/Lm5hdlRhYkNvbmZpZyB8fCBbXSlcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8vIFJldHVybiBvbmx5IHRoZSBDb21wb2RvYyBjb25maWd1cmF0aW9uIC0gbm8gdGVtcGxhdGUgdmFyaWFibGVzXHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlRGF0YSA9IGNvbXBvZG9jQ29uZmlnO1xyXG4gICAgICAgICAgICBsZXQgYWRkaXRpb25hbENvbnRleHQ6IGFueSA9IHt9O1xyXG4gICAgICAgICAgICBsZXQgdGVtcGxhdGVWYXJpYWJsZXM6IGFueTtcclxuXHJcbiAgICAgICAgICAgIC8vIERldGVybWluZSB0ZW1wbGF0ZSB0eXBlIGFuZCBwcm92aWRlIGNvbXByZWhlbnNpdmUgcmVhbGlzdGljIGRhdGFcclxuICAgICAgICAgICAgaWYgKHRlbXBsYXRlTmFtZS5pbmNsdWRlcygnY29tcG9uZW50JykpIHtcclxuICAgICAgICAgICAgICAgIHRlbXBsYXRlVmFyaWFibGVzID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIENvcmUgY29tcG9uZW50IGRhdGFcclxuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnVXNlclByb2ZpbGVDb21wb25lbnQnLFxyXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQSBjb21wcmVoZW5zaXZlIHVzZXIgcHJvZmlsZSBtYW5hZ2VtZW50IGNvbXBvbmVudCB0aGF0IGhhbmRsZXMgdXNlciBpbmZvcm1hdGlvbiBkaXNwbGF5IGFuZCBlZGl0aW5nIGNhcGFiaWxpdGllcy4nLFxyXG4gICAgICAgICAgICAgICAgICAgIGZpbGU6ICdzcmMvYXBwL2NvbXBvbmVudHMvdXNlci1wcm9maWxlL3VzZXItcHJvZmlsZS5jb21wb25lbnQudHMnLFxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdG9yOiAnYXBwLXVzZXItcHJvZmlsZScsXHJcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcuL3VzZXItcHJvZmlsZS5jb21wb25lbnQuaHRtbCcsXHJcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVVcmxzOiBbJy4vdXNlci1wcm9maWxlLmNvbXBvbmVudC5zY3NzJywgJy4vdXNlci1wcm9maWxlLnRoZW1lLnNjc3MnXSxcclxuICAgICAgICAgICAgICAgICAgICBlbmNhcHN1bGF0aW9uOiAnVmlld0VuY2Fwc3VsYXRpb24uRW11bGF0ZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZURldGVjdGlvbjogJ0NoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaCcsXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIENvbXBvbmVudCBtZXRhZGF0YVxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdjb21wb25lbnQnLFxyXG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZUNvZGU6ICdleHBvcnQgY2xhc3MgVXNlclByb2ZpbGVDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQsIE9uRGVzdHJveSB7IC4uLiB9JyxcclxuICAgICAgICAgICAgICAgICAgICByYXdGaWxlOiAndXNlci1wcm9maWxlLmNvbXBvbmVudC50cycsXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRlbXBsYXRlIGFuZCBzdHlsZXNcclxuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZURhdGE6ICc8ZGl2IGNsYXNzPVwidXNlci1wcm9maWxlXCI+XFxcXG4gIDxoMj57e3VzZXIubmFtZX19PC9oMj5cXFxcbiAgPHA+e3t1c2VyLmVtYWlsfX08L3A+XFxcXG48L2Rpdj4nLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlVXJsc0RhdGE6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJy51c2VyLXByb2ZpbGUgeyBwYWRkaW5nOiAyMHB4OyB9XFxcXG4udXNlci1wcm9maWxlIGgyIHsgY29sb3I6ICMzMzM7IH0nXHJcbiAgICAgICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgICAgICBzdHlsZXNEYXRhOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc6aG9zdCB7IGRpc3BsYXk6IGJsb2NrOyBtYXJnaW46IDEwcHg7IH0nXHJcbiAgICAgICAgICAgICAgICAgICAgXSxcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gSW5wdXRzIGFuZCBPdXRwdXRzXHJcbiAgICAgICAgICAgICAgICAgICAgaW5wdXRzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICd1c2VyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdVc2VyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVGhlIHVzZXIgb2JqZWN0IGNvbnRhaW5pbmcgcHJvZmlsZSBpbmZvcm1hdGlvbicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWNvcmF0b3JzOiBbJ0BJbnB1dCgpJ10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25hbDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0VmFsdWU6IG51bGxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2VkaXRhYmxlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnV2hldGhlciB0aGUgcHJvZmlsZSBjYW4gYmUgZWRpdGVkJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlY29yYXRvcnM6IFsnQElucHV0KCknXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbmFsOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFZhbHVlOiAnZmFsc2UnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICdzaG93QXZhdGFyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ29udHJvbHMgYXZhdGFyIHZpc2liaWxpdHknLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVjb3JhdG9yczogWydASW5wdXQoKSddLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uYWw6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0VmFsdWU6ICd0cnVlJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgICAgICBvdXRwdXRzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICd1c2VyVXBkYXRlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnRXZlbnRFbWl0dGVyPFVzZXI+JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRW1pdHRlZCB3aGVuIHVzZXIgcHJvZmlsZSBpcyB1cGRhdGVkJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlY29yYXRvcnM6IFsnQE91dHB1dCgpJ11cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2F2YXRhckNsaWNrZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ0V2ZW50RW1pdHRlcjxNb3VzZUV2ZW50PicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0VtaXR0ZWQgd2hlbiB1c2VyIGNsaWNrcyBvbiBhdmF0YXInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVjb3JhdG9yczogWydAT3V0cHV0KCknXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgXSxcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gTWV0aG9kc1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZHM6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ25nT25Jbml0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICd2b2lkJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQW5ndWxhciBsaWZlY3ljbGUgaG9vayBmb3IgY29tcG9uZW50IGluaXRpYWxpemF0aW9uJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3M6IFtdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuVHlwZTogJ3ZvaWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kaWZpZXJLaW5kOiAncHVibGljJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAndXBkYXRlUHJvZmlsZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnUHJvbWlzZTx2b2lkPicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1VwZGF0ZXMgdGhlIHVzZXIgcHJvZmlsZSB3aXRoIG5ldyBpbmZvcm1hdGlvbicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBuYW1lOiAndXNlckRhdGEnLCB0eXBlOiAnUGFydGlhbDxVc2VyPicgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblR5cGU6ICdQcm9taXNlPHZvaWQ+JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGlmaWVyS2luZDogJ3B1YmxpYydcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ3ZhbGlkYXRlRm9ybScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1ZhbGlkYXRlcyB0aGUgcHJvZmlsZSBmb3JtIGRhdGEnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJnczogW10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5UeXBlOiAnYm9vbGVhbicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RpZmllcktpbmQ6ICdwcml2YXRlJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgXSxcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUHJvcGVydGllc1xyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2lzTG9hZGluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0luZGljYXRlcyBpZiBjb21wb25lbnQgaXMgaW4gbG9hZGluZyBzdGF0ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0VmFsdWU6ICdmYWxzZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RpZmllcktpbmQ6ICdwdWJsaWMnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICdmb3JtJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdGb3JtR3JvdXAnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdSZWFjdGl2ZSBmb3JtIGZvciB1c2VyIHByb2ZpbGUgZWRpdGluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RpZmllcktpbmQ6ICdwdWJsaWMnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBdLFxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBIb3N0IGxpc3RlbmVycyBhbmQgYmluZGluZ3NcclxuICAgICAgICAgICAgICAgICAgICBob3N0TGlzdGVuZXJzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICdjbGljaycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdzOiBbJyRldmVudCddLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdIYW5kbGVzIGNsaWNrIGV2ZW50cyBvbiB0aGUgY29tcG9uZW50J1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgICAgICBob3N0QmluZGluZ3M6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2NsYXNzLmFjdGl2ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogJ2lzQWN0aXZlJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgXSxcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gTGlmZWN5Y2xlIGhvb2tzXHJcbiAgICAgICAgICAgICAgICAgICAgaW1wbGVtZW50czogWydPbkluaXQnLCAnT25EZXN0cm95JywgJ0FmdGVyVmlld0luaXQnXSxcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRGVwZW5kZW5jeSBpbmplY3Rpb25cclxuICAgICAgICAgICAgICAgICAgICBjb25zdHJ1Y3Rvck9iajoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnY29uc3RydWN0b3InLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0NvbXBvbmVudCBjb25zdHJ1Y3RvciB3aXRoIGRlcGVuZGVuY3kgaW5qZWN0aW9uJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXJnczogW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBuYW1lOiAndXNlclNlcnZpY2UnLCB0eXBlOiAnVXNlclNlcnZpY2UnIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IG5hbWU6ICdyb3V0ZXInLCB0eXBlOiAnUm91dGVyJyB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBuYW1lOiAnY2QnLCB0eXBlOiAnQ2hhbmdlRGV0ZWN0b3JSZWYnIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEFuZ3VsYXItc3BlY2lmaWMgbWV0YWRhdGFcclxuICAgICAgICAgICAgICAgICAgICBwcm92aWRlcnM6IFsnVXNlclNlcnZpY2UnXSxcclxuICAgICAgICAgICAgICAgICAgICB2aWV3UHJvdmlkZXJzOiBbXSxcclxuICAgICAgICAgICAgICAgICAgICBxdWVyaWVzOiBbXSxcclxuICAgICAgICAgICAgICAgICAgICBleHBvcnRBczogJ3VzZXJQcm9maWxlJyxcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRG9jdW1lbnRhdGlvbiBtZXRhZGF0YVxyXG4gICAgICAgICAgICAgICAgICAgIGpzZG9jdGFnczogW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWdOYW1lOiB7IHRleHQ6ICdleGFtcGxlJyB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tbWVudDogJzxhcHAtdXNlci1wcm9maWxlIFt1c2VyXT1cImN1cnJlbnRVc2VyXCIgW2VkaXRhYmxlXT1cInRydWVcIj48L2FwcC11c2VyLXByb2ZpbGU+J1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgXSxcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ292ZXJhZ2UgaW5mb3JtYXRpb24gKGlmIGVuYWJsZWQpXHJcbiAgICAgICAgICAgICAgICAgICAgY292ZXJhZ2VQZXJjZW50OiA4NSxcclxuICAgICAgICAgICAgICAgICAgICBjb3ZlcmFnZUNvdW50OiAnMTcvMjAnLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXR1czogJ2dvb2QnXHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIGFkZGl0aW9uYWxDb250ZXh0ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGRlcHRoOiAxLFxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFkY3J1bWJzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ0NvbXBvbmVudHMnLCB1cmw6ICcuLi9jb21wb25lbnRzLmh0bWwnIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ1VzZXJQcm9maWxlQ29tcG9uZW50JywgdXJsOiAnIycgfVxyXG4gICAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRlbXBsYXRlTmFtZS5pbmNsdWRlcygnc2VydmljZScpIHx8IHRlbXBsYXRlTmFtZS5pbmNsdWRlcygnaW5qZWN0YWJsZScpKSB7XHJcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVZhcmlhYmxlcyA9IHtcclxuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnVXNlclNlcnZpY2UnLFxyXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnU2VydmljZSByZXNwb25zaWJsZSBmb3IgbWFuYWdpbmcgdXNlciBkYXRhIGFuZCBhdXRoZW50aWNhdGlvbiBvcGVyYXRpb25zJyxcclxuICAgICAgICAgICAgICAgICAgICBmaWxlOiAnc3JjL2FwcC9zZXJ2aWNlcy91c2VyLnNlcnZpY2UudHMnLFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdpbmplY3RhYmxlJyxcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gSW5qZWN0YWJsZSBtZXRhZGF0YVxyXG4gICAgICAgICAgICAgICAgICAgIHByb3ZpZGVkSW46ICdyb290JyxcclxuICAgICAgICAgICAgICAgICAgICBkZWNvcmF0b3JzOiBbJ0BJbmplY3RhYmxlKCknXSxcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gTWV0aG9kc1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZHM6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2dldFVzZXInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ09ic2VydmFibGU8VXNlcj4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdSZXRyaWV2ZXMgdXNlciBkYXRhIGJ5IElEJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3M6IFt7IG5hbWU6ICdpZCcsIHR5cGU6ICdzdHJpbmcnIH1dLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuVHlwZTogJ09ic2VydmFibGU8VXNlcj4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kaWZpZXJLaW5kOiAncHVibGljJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAndXBkYXRlVXNlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnT2JzZXJ2YWJsZTxVc2VyPicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1VwZGF0ZXMgdXNlciBpbmZvcm1hdGlvbicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBuYW1lOiAnaWQnLCB0eXBlOiAnc3RyaW5nJyB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ3VzZXJEYXRhJywgdHlwZTogJ1BhcnRpYWw8VXNlcj4nIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5UeXBlOiAnT2JzZXJ2YWJsZTxVc2VyPicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RpZmllcktpbmQ6ICdwdWJsaWMnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICdkZWxldGVVc2VyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdPYnNlcnZhYmxlPHZvaWQ+JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRGVsZXRlcyBhIHVzZXIgYWNjb3VudCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdzOiBbeyBuYW1lOiAnaWQnLCB0eXBlOiAnc3RyaW5nJyB9XSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblR5cGU6ICdPYnNlcnZhYmxlPHZvaWQ+JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZGlmaWVyS2luZDogJ3B1YmxpYydcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIF0sXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFByb3BlcnRpZXNcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICdjdXJyZW50VXNlciQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ0JlaGF2aW9yU3ViamVjdDxVc2VyIHwgbnVsbD4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdPYnNlcnZhYmxlIHN0cmVhbSBvZiBjdXJyZW50IHVzZXIgc3RhdGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kaWZpZXJLaW5kOiAncHJpdmF0ZSdcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2FwaVVybCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQmFzZSBVUkwgZm9yIHVzZXIgQVBJIGVuZHBvaW50cycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0VmFsdWU6ICdcIi9hcGkvdXNlcnNcIicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2RpZmllcktpbmQ6ICdwcml2YXRlJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgXSxcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ29uc3RydWN0b3JcclxuICAgICAgICAgICAgICAgICAgICBjb25zdHJ1Y3Rvck9iajoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnY29uc3RydWN0b3InLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NlcnZpY2UgY29uc3RydWN0b3Igd2l0aCBIVFRQIGNsaWVudCBpbmplY3Rpb24nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IG5hbWU6ICdodHRwJywgdHlwZTogJ0h0dHBDbGllbnQnIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IG5hbWU6ICdjb25maWcnLCB0eXBlOiAnQXBwQ29uZmlnJyB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBDb3ZlcmFnZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvdmVyYWdlUGVyY2VudDogOTIsXHJcbiAgICAgICAgICAgICAgICAgICAgY292ZXJhZ2VDb3VudDogJzIzLzI1J1xyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGVtcGxhdGVOYW1lLmluY2x1ZGVzKCdtb2R1bGUnKSkge1xyXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVWYXJpYWJsZXMgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJ1VzZXJNb2R1bGUnLFxyXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRmVhdHVyZSBtb2R1bGUgY29udGFpbmluZyB1c2VyLXJlbGF0ZWQgY29tcG9uZW50cyBhbmQgc2VydmljZXMnLFxyXG4gICAgICAgICAgICAgICAgICAgIGZpbGU6ICdzcmMvYXBwL21vZHVsZXMvdXNlci91c2VyLm1vZHVsZS50cycsXHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ21vZHVsZScsXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIE1vZHVsZSBtZXRhZGF0YVxyXG4gICAgICAgICAgICAgICAgICAgIGRlY2xhcmF0aW9uczogW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB7IG5hbWU6ICdVc2VyUHJvZmlsZUNvbXBvbmVudCcsIHR5cGU6ICdjb21wb25lbnQnIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ1VzZXJMaXN0Q29tcG9uZW50JywgdHlwZTogJ2NvbXBvbmVudCcgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgeyBuYW1lOiAnVXNlckNhcmREaXJlY3RpdmUnLCB0eXBlOiAnZGlyZWN0aXZlJyB9XHJcbiAgICAgICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgICAgICBpbXBvcnRzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ0NvbW1vbk1vZHVsZScsIHR5cGU6ICdtb2R1bGUnIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ1JlYWN0aXZlRm9ybXNNb2R1bGUnLCB0eXBlOiAnbW9kdWxlJyB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7IG5hbWU6ICdSb3V0ZXJNb2R1bGUnLCB0eXBlOiAnbW9kdWxlJyB9XHJcbiAgICAgICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgICAgICBleHBvcnRzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ1VzZXJQcm9maWxlQ29tcG9uZW50JywgdHlwZTogJ2NvbXBvbmVudCcgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgeyBuYW1lOiAnVXNlckxpc3RDb21wb25lbnQnLCB0eXBlOiAnY29tcG9uZW50JyB9XHJcbiAgICAgICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgICAgICBwcm92aWRlcnM6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgeyBuYW1lOiAnVXNlclNlcnZpY2UnLCB0eXBlOiAnc2VydmljZScgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgeyBuYW1lOiAnVXNlclJlc29sdmVyJywgdHlwZTogJ3Jlc29sdmVyJyB9XHJcbiAgICAgICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgICAgICBib290c3RyYXA6IFtdLFxyXG4gICAgICAgICAgICAgICAgICAgIHNjaGVtYXM6IFtdXHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIGlmICh0ZW1wbGF0ZU5hbWUuaW5jbHVkZXMoJ2ludGVyZmFjZScpKSB7XHJcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVZhcmlhYmxlcyA9IHtcclxuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnVXNlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdJbnRlcmZhY2UgZGVmaW5pbmcgdGhlIHN0cnVjdHVyZSBvZiB1c2VyIG9iamVjdHMnLFxyXG4gICAgICAgICAgICAgICAgICAgIGZpbGU6ICdzcmMvYXBwL2ludGVyZmFjZXMvdXNlci5pbnRlcmZhY2UudHMnLFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdpbnRlcmZhY2UnLFxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBJbnRlcmZhY2UgcHJvcGVydGllc1xyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2lkJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHVzZXInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uYWw6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICdlbWFpbCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVXNlciBlbWFpbCBhZGRyZXNzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbmFsOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnbmFtZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRnVsbCBuYW1lIG9mIHRoZSB1c2VyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbmFsOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnYXZhdGFyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdVUkwgdG8gdXNlciBhdmF0YXIgaW1hZ2UnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9uYWw6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ3JvbGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ1VzZXJSb2xlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVXNlciByb2xlIHBlcm1pc3Npb25zJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbmFsOiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBdLFxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBJbnRlcmZhY2UgbWV0aG9kcyAoaWYgYW55KVxyXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZHM6IFtdLFxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBJbmRleCBzaWduYXR1cmVzXHJcbiAgICAgICAgICAgICAgICAgICAgaW5kZXhTaWduYXR1cmVzOiBbXVxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBHZW5lcmljIGRhdGEgZm9yIG90aGVyIHRlbXBsYXRlcyAoZGlyZWN0aXZlLCBwaXBlLCBndWFyZCwgZXRjLilcclxuICAgICAgICAgICAgICAgIHRlbXBsYXRlVmFyaWFibGVzID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICdFeGFtcGxlSXRlbScsXHJcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBIHNhbXBsZSBpdGVtIGZvciBkZW1vbnN0cmF0aW9uIHB1cnBvc2VzJyxcclxuICAgICAgICAgICAgICAgICAgICBmaWxlOiAnc3JjL2FwcC9leGFtcGxlLnRzJyxcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnY2xhc3MnLFxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBCYXNpYyBwcm9wZXJ0aWVzIHRoYXQgbW9zdCB0ZW1wbGF0ZXMgd291bGQgaGF2ZVxyXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZHM6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ25nT25Jbml0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICd2b2lkJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTGlmZWN5Y2xlIGhvb2snLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJnczogW10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5UeXBlOiAndm9pZCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczogW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnaXNBY3RpdmUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBY3RpdmUgc3RhdGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFZhbHVlOiAnZmFsc2UnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBBZGQgY29tbW9uIHRlbXBsYXRlIGNvbnRleHQgdmFyaWFibGVzIHRoYXQgYWxsIHRlbXBsYXRlcyByZWNlaXZlXHJcbiAgICAgICAgICAgIGNvbnN0IGNvbW1vbkNvbnRleHQgPSB7XHJcbiAgICAgICAgICAgICAgICAvLyBOYXZpZ2F0aW9uIGFuZCBVSVxyXG4gICAgICAgICAgICAgICAgZGVwdGg6IGFkZGl0aW9uYWxDb250ZXh0LmRlcHRoIHx8IDAsXHJcbiAgICAgICAgICAgICAgICBicmVhZGNydW1iczogYWRkaXRpb25hbENvbnRleHQuYnJlYWRjcnVtYnMgfHwgW10sXHJcbiAgICAgICAgICAgICAgICBuYXZUYWJzOiBjb21wb2RvY0NvbmZpZy5uYXZUYWJDb25maWcsXHJcblxyXG4gICAgICAgICAgICAgICAgLy8gSGVscGVyIGZ1bmN0aW9ucyBhdmFpbGFibGUgaW4gdGVtcGxhdGVzXHJcbiAgICAgICAgICAgICAgICB0OiAoa2V5OiBzdHJpbmcpID0+IGBbVHJhbnNsYXRpb246ICR7a2V5fV1gLCAvLyBTaW11bGF0ZXMgaTE4biBmdW5jdGlvblxyXG4gICAgICAgICAgICAgICAgcmVsYXRpdmVVUkw6ICh1cmw6IHN0cmluZykgPT4gdXJsLCAvLyBVUkwgaGVscGVyXHJcblxyXG4gICAgICAgICAgICAgICAgLy8gUHJvamVjdCBpbmZvcm1hdGlvblxyXG4gICAgICAgICAgICAgICAgcHJvamVjdFRpdGxlOiAoY29tcG9kb2NDb25maWcgYXMgYW55KS5kb2N1bWVudGF0aW9uTWFpbk5hbWUgfHwgY29tcG9kb2NDb25maWcubmFtZSB8fCAnRG9jdW1lbnRhdGlvbicsXHJcbiAgICAgICAgICAgICAgICBwcm9qZWN0RGVzY3JpcHRpb246IChjb21wb2RvY0NvbmZpZyBhcyBhbnkpLmRvY3VtZW50YXRpb25NYWluRGVzY3JpcHRpb24gfHwgJ0RvY3VtZW50YXRpb24gZGVzY3JpcHRpb24nLFxyXG5cclxuICAgICAgICAgICAgICAgIC8vIEN1cnJlbnQgcGFnZSBjb250ZXh0XHJcbiAgICAgICAgICAgICAgICBwYWdlVHlwZTogdGVtcGxhdGVOYW1lLFxyXG4gICAgICAgICAgICAgICAgcGFnZU5hbWU6IHRlbXBsYXRlVmFyaWFibGVzLm5hbWUgfHwgJ1Vua25vd24nLFxyXG5cclxuICAgICAgICAgICAgICAgIC8vIEZlYXR1cmUgZmxhZ3MgKGZyb20gY29uZmlnKVxyXG4gICAgICAgICAgICAgICAgc2hvd1NvdXJjZUNvZGU6ICFjb21wb2RvY0NvbmZpZy5kaXNhYmxlU291cmNlQ29kZSxcclxuICAgICAgICAgICAgICAgIHNob3dHcmFwaDogIWNvbXBvZG9jQ29uZmlnLmRpc2FibGVHcmFwaCxcclxuICAgICAgICAgICAgICAgIHNob3dDb3ZlcmFnZTogIWNvbXBvZG9jQ29uZmlnLmRpc2FibGVDb3ZlcmFnZSxcclxuICAgICAgICAgICAgICAgIHNob3dQcml2YXRlTWVtYmVyczogIWNvbXBvZG9jQ29uZmlnLmRpc2FibGVQcml2YXRlLFxyXG4gICAgICAgICAgICAgICAgc2hvd1Byb3RlY3RlZE1lbWJlcnM6ICFjb21wb2RvY0NvbmZpZy5kaXNhYmxlUHJvdGVjdGVkLFxyXG4gICAgICAgICAgICAgICAgc2hvd0ludGVybmFsTWVtYmVyczogIWNvbXBvZG9jQ29uZmlnLmRpc2FibGVJbnRlcm5hbFxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLy8gUmV0dXJuIG9ubHkgdGhlIENvbXBvZG9jIGNvbmZpZ3VyYXRpb24gb3B0aW9uc1xyXG4gICAgICAgICAgICByZXMuanNvbih7XHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgY2F0ZWdvcmllczoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbXBvZG9jQ29uZmlnOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnQ29tcG9kb2MgQ29uZmlndXJhdGlvbiBPcHRpb25zJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdFZGl0IHRoZXNlIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyB0byBjdXN0b21pemUgdGhlIGdlbmVyYXRlZCBkb2N1bWVudGF0aW9uLiBDaGFuZ2VzIHdpbGwgYXV0b21hdGljYWxseSByZWdlbmVyYXRlIHRoZSBkb2N1bWVudGF0aW9uLicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IGNvbXBvZG9jQ29uZmlnXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBMZWdhY3kgZm9ybWF0IGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5XHJcbiAgICAgICAgICAgICAgICBkYXRhOiBjb21wb2RvY0NvbmZpZyxcclxuICAgICAgICAgICAgICAgIGNvbnRleHQ6IHsgY29uZmlnOiBjb21wb2RvY0NvbmZpZyB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0Vycm9yIGdldHRpbmcgc2Vzc2lvbiB0ZW1wbGF0ZSBkYXRhOicsIGVycm9yKTtcclxuICAgICAgICAgICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnRmFpbGVkIHRvIGdldCB0ZW1wbGF0ZSBkYXRhJyxcclxuICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZVNlc3Npb25Eb2NzKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgc2Vzc2lvbklkIH0gPSByZXEucGFyYW1zO1xyXG4gICAgICAgICAgICBjb25zdCB7IGN1c3RvbVRlbXBsYXRlQ29udGVudCwgbW9ja0RhdGEgfSA9IHJlcS5ib2R5O1xyXG5cclxuICAgICAgICAgICAgaWYgKCF0aGlzLnNlc3Npb25zLmhhcyhzZXNzaW9uSWQpKSB7XHJcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzKDQwNCkuanNvbih7XHJcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ1Nlc3Npb24gbm90IGZvdW5kJ1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHNlc3Npb24gPSB0aGlzLnNlc3Npb25zLmdldChzZXNzaW9uSWQpO1xyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVNlc3Npb25BY3Rpdml0eShzZXNzaW9uSWQpO1xyXG5cclxuICAgICAgICAgICAgLy8gU2F2ZSB0aGUgY3VzdG9tIHRlbXBsYXRlIGNvbnRlbnQgaWYgcHJvdmlkZWRcclxuICAgICAgICAgICAgaWYgKGN1c3RvbVRlbXBsYXRlQ29udGVudCAmJiByZXEuYm9keS50ZW1wbGF0ZVBhdGgpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlUGF0aCA9IHBhdGguam9pbihzZXNzaW9uLnRlbXBsYXRlRGlyLCByZXEuYm9keS50ZW1wbGF0ZVBhdGgpO1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgZnMud3JpdGVGaWxlKHRlbXBsYXRlUGF0aCwgY3VzdG9tVGVtcGxhdGVDb250ZW50LCAndXRmOCcpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBHZW5lcmF0ZSBkb2N1bWVudGF0aW9uIGZvciB0aGlzIHNlc3Npb25cclxuICAgICAgICAgICAgdGhpcy5nZW5lcmF0ZURvY3VtZW50YXRpb24oc2Vzc2lvbklkLCBmYWxzZSk7IC8vIE5vIGRlYm91bmNlIGZvciBtYW51YWwgZ2VuZXJhdGlvblxyXG5cclxuICAgICAgICAgICAgcmVzLmpzb24oe1xyXG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdEb2N1bWVudGF0aW9uIGdlbmVyYXRpb24gc3RhcnRlZCcsXHJcbiAgICAgICAgICAgICAgICBzZXNzaW9uSWQ6IHNlc3Npb25JZFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvciBnZW5lcmF0aW5nIHNlc3Npb24gZG9jdW1lbnRhdGlvbjonLCBlcnJvcik7XHJcbiAgICAgICAgICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ0ZhaWxlZCB0byBnZW5lcmF0ZSBkb2N1bWVudGF0aW9uJyxcclxuICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRTZXNzaW9uQ29uZmlnKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHNlc3Npb25JZCA9IHJlcS5wYXJhbXMuc2Vzc2lvbklkO1xyXG4gICAgICAgICAgICBjb25zdCBzZXNzaW9uID0gdGhpcy5zZXNzaW9ucy5nZXQoc2Vzc2lvbklkKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghc2Vzc2lvbikge1xyXG4gICAgICAgICAgICAgICAgcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBzdWNjZXNzOiBmYWxzZSwgbWVzc2FnZTogJ1Nlc3Npb24gbm90IGZvdW5kJyB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy51cGRhdGVTZXNzaW9uQWN0aXZpdHkoc2Vzc2lvbklkKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFJldHVybiBjb21wbGV0ZSBDb21wb2RvYyBjb25maWd1cmF0aW9uIHdpdGggY3VycmVudCB2YWx1ZXMgb3IgZGVmYXVsdHNcclxuICAgICAgICAgICAgY29uc3QgZnVsbENvbmZpZyA9IHtcclxuICAgICAgICAgICAgICAgIC8vIERvY3VtZW50YXRpb24gTWV0YWRhdGFcclxuICAgICAgICAgICAgICAgIG5hbWU6IHNlc3Npb24uY29uZmlnPy5uYW1lIHx8ICdBcHBsaWNhdGlvbiBkb2N1bWVudGF0aW9uJyxcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBQYXRocyBhbmQgT3V0cHV0XHJcbiAgICAgICAgICAgICAgICBvdXRwdXQ6IHNlc3Npb24uY29uZmlnPy5vdXRwdXQgfHwgJy4vZG9jdW1lbnRhdGlvbi8nLFxyXG4gICAgICAgICAgICAgICAgdGhlbWU6IHNlc3Npb24uY29uZmlnPy50aGVtZSB8fCAnZ2l0Ym9vaycsXHJcbiAgICAgICAgICAgICAgICBsYW5ndWFnZTogc2Vzc2lvbi5jb25maWc/Lmxhbmd1YWdlIHx8ICdlbi1VUycsXHJcbiAgICAgICAgICAgICAgICBiYXNlOiBzZXNzaW9uLmNvbmZpZz8uYmFzZSB8fCAnLycsXHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQXNzZXRzIGFuZCBDdXN0b20gVUlcclxuICAgICAgICAgICAgICAgIGN1c3RvbUZhdmljb246IHNlc3Npb24uY29uZmlnPy5jdXN0b21GYXZpY29uIHx8ICcnLFxyXG4gICAgICAgICAgICAgICAgY3VzdG9tTG9nbzogc2Vzc2lvbi5jb25maWc/LmN1c3RvbUxvZ28gfHwgJycsXHJcbiAgICAgICAgICAgICAgICBhc3NldHNGb2xkZXI6IHNlc3Npb24uY29uZmlnPy5hc3NldHNGb2xkZXIgfHwgJycsXHJcbiAgICAgICAgICAgICAgICBleHRUaGVtZTogc2Vzc2lvbi5jb25maWc/LmV4dFRoZW1lIHx8ICcnLFxyXG5cclxuICAgICAgICAgICAgICAgIC8vIEZlYXR1cmUgVG9nZ2xlcyAtIERpc2FibGUgT3B0aW9uc1xyXG4gICAgICAgICAgICAgICAgZGlzYWJsZVNvdXJjZUNvZGU6ICEhc2Vzc2lvbi5jb25maWc/LmRpc2FibGVTb3VyY2VDb2RlLFxyXG4gICAgICAgICAgICAgICAgZGlzYWJsZUdyYXBoOiAhIXNlc3Npb24uY29uZmlnPy5kaXNhYmxlR3JhcGgsXHJcbiAgICAgICAgICAgICAgICBkaXNhYmxlQ292ZXJhZ2U6ICEhc2Vzc2lvbi5jb25maWc/LmRpc2FibGVDb3ZlcmFnZSxcclxuICAgICAgICAgICAgICAgIGRpc2FibGVQcml2YXRlOiAhIXNlc3Npb24uY29uZmlnPy5kaXNhYmxlUHJpdmF0ZSxcclxuICAgICAgICAgICAgICAgIGRpc2FibGVQcm90ZWN0ZWQ6ICEhc2Vzc2lvbi5jb25maWc/LmRpc2FibGVQcm90ZWN0ZWQsXHJcbiAgICAgICAgICAgICAgICBkaXNhYmxlSW50ZXJuYWw6ICEhc2Vzc2lvbi5jb25maWc/LmRpc2FibGVJbnRlcm5hbCxcclxuICAgICAgICAgICAgICAgIGRpc2FibGVMaWZlQ3ljbGVIb29rczogISFzZXNzaW9uLmNvbmZpZz8uZGlzYWJsZUxpZmVDeWNsZUhvb2tzLFxyXG4gICAgICAgICAgICAgICAgZGlzYWJsZUNvbnN0cnVjdG9yczogISFzZXNzaW9uLmNvbmZpZz8uZGlzYWJsZUNvbnN0cnVjdG9ycyxcclxuICAgICAgICAgICAgICAgIGRpc2FibGVSb3V0ZXNHcmFwaDogISFzZXNzaW9uLmNvbmZpZz8uZGlzYWJsZVJvdXRlc0dyYXBoLFxyXG4gICAgICAgICAgICAgICAgZGlzYWJsZVNlYXJjaDogISFzZXNzaW9uLmNvbmZpZz8uZGlzYWJsZVNlYXJjaCxcclxuICAgICAgICAgICAgICAgIGRpc2FibGVEZXBlbmRlbmNpZXM6ICEhc2Vzc2lvbi5jb25maWc/LmRpc2FibGVEZXBlbmRlbmNpZXMsXHJcbiAgICAgICAgICAgICAgICBkaXNhYmxlUHJvcGVydGllczogISFzZXNzaW9uLmNvbmZpZz8uZGlzYWJsZVByb3BlcnRpZXMsXHJcbiAgICAgICAgICAgICAgICBkaXNhYmxlRG9tVHJlZTogISFzZXNzaW9uLmNvbmZpZz8uZGlzYWJsZURvbVRyZWUsXHJcbiAgICAgICAgICAgICAgICBkaXNhYmxlVGVtcGxhdGVUYWI6ICEhc2Vzc2lvbi5jb25maWc/LmRpc2FibGVUZW1wbGF0ZVRhYixcclxuICAgICAgICAgICAgICAgIGRpc2FibGVTdHlsZVRhYjogISFzZXNzaW9uLmNvbmZpZz8uZGlzYWJsZVN0eWxlVGFiLFxyXG4gICAgICAgICAgICAgICAgZGlzYWJsZU1haW5HcmFwaDogISFzZXNzaW9uLmNvbmZpZz8uZGlzYWJsZU1haW5HcmFwaCxcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBVSSBPcHRpb25zXHJcbiAgICAgICAgICAgICAgICBoaWRlR2VuZXJhdG9yOiAhIXNlc3Npb24uY29uZmlnPy5oaWRlR2VuZXJhdG9yLFxyXG4gICAgICAgICAgICAgICAgaGlkZURhcmtNb2RlVG9nZ2xlOiAhIXNlc3Npb24uY29uZmlnPy5oaWRlRGFya01vZGVUb2dnbGUsXHJcbiAgICAgICAgICAgICAgICBtaW5pbWFsOiAhIXNlc3Npb24uY29uZmlnPy5taW5pbWFsLFxyXG5cclxuICAgICAgICAgICAgICAgIC8vIEFkZGl0aW9uYWwgQ29udGVudFxyXG4gICAgICAgICAgICAgICAgaW5jbHVkZXM6IHNlc3Npb24uY29uZmlnPy5pbmNsdWRlcyB8fCAnJyxcclxuICAgICAgICAgICAgICAgIGluY2x1ZGVzTmFtZTogc2Vzc2lvbi5jb25maWc/LmluY2x1ZGVzTmFtZSB8fCAnQWRkaXRpb25hbCBkb2N1bWVudGF0aW9uJyxcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBTZXJ2aW5nIE9wdGlvbnNcclxuICAgICAgICAgICAgICAgIHBvcnQ6IHNlc3Npb24uY29uZmlnPy5wb3J0IHx8IDgwODAsXHJcbiAgICAgICAgICAgICAgICBob3N0bmFtZTogc2Vzc2lvbi5jb25maWc/Lmhvc3RuYW1lIHx8ICcxMjcuMC4wLjEnLFxyXG4gICAgICAgICAgICAgICAgc2VydmU6ICEhc2Vzc2lvbi5jb25maWc/LnNlcnZlLFxyXG4gICAgICAgICAgICAgICAgb3BlbjogISFzZXNzaW9uLmNvbmZpZz8ub3BlbixcclxuICAgICAgICAgICAgICAgIHdhdGNoOiAhIXNlc3Npb24uY29uZmlnPy53YXRjaCxcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBFeHBvcnQgT3B0aW9uc1xyXG4gICAgICAgICAgICAgICAgZXhwb3J0Rm9ybWF0OiBzZXNzaW9uLmNvbmZpZz8uZXhwb3J0Rm9ybWF0IHx8ICdodG1sJyxcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBDb3ZlcmFnZSBPcHRpb25zXHJcbiAgICAgICAgICAgICAgICBjb3ZlcmFnZVRlc3Q6ICEhc2Vzc2lvbi5jb25maWc/LmNvdmVyYWdlVGVzdCxcclxuICAgICAgICAgICAgICAgIGNvdmVyYWdlVGVzdFRocmVzaG9sZDogc2Vzc2lvbi5jb25maWc/LmNvdmVyYWdlVGVzdFRocmVzaG9sZCB8fCA3MCxcclxuICAgICAgICAgICAgICAgIGNvdmVyYWdlTWluaW11bVBlckZpbGU6IHNlc3Npb24uY29uZmlnPy5jb3ZlcmFnZU1pbmltdW1QZXJGaWxlIHx8IDAsXHJcbiAgICAgICAgICAgICAgICBjb3ZlcmFnZVRlc3RUaHJlc2hvbGRGYWlsOiAhIXNlc3Npb24uY29uZmlnPy5jb3ZlcmFnZVRlc3RUaHJlc2hvbGRGYWlsLFxyXG4gICAgICAgICAgICAgICAgY292ZXJhZ2VUZXN0U2hvd09ubHlGYWlsZWQ6ICEhc2Vzc2lvbi5jb25maWc/LmNvdmVyYWdlVGVzdFNob3dPbmx5RmFpbGVkLFxyXG4gICAgICAgICAgICAgICAgdW5pdFRlc3RDb3ZlcmFnZTogc2Vzc2lvbi5jb25maWc/LnVuaXRUZXN0Q292ZXJhZ2UgfHwgJycsXHJcblxyXG4gICAgICAgICAgICAgICAgLy8gR29vZ2xlIEFuYWx5dGljc1xyXG4gICAgICAgICAgICAgICAgZ2FJRDogc2Vzc2lvbi5jb25maWc/LmdhSUQgfHwgJycsXHJcbiAgICAgICAgICAgICAgICBnYVNpdGU6IHNlc3Npb24uY29uZmlnPy5nYVNpdGUgfHwgJ2F1dG8nLFxyXG5cclxuICAgICAgICAgICAgICAgIC8vIEFkdmFuY2VkIE9wdGlvbnNcclxuICAgICAgICAgICAgICAgIHNpbGVudDogISFzZXNzaW9uLmNvbmZpZz8uc2lsZW50LFxyXG4gICAgICAgICAgICAgICAgbWF4U2VhcmNoUmVzdWx0czogc2Vzc2lvbi5jb25maWc/Lm1heFNlYXJjaFJlc3VsdHMgfHwgMTUsXHJcblxyXG4gICAgICAgICAgICAgICAgLy8gTWVudSBDb25maWd1cmF0aW9uIChhcyBKU09OIHN0cmluZyBmb3IgZWRpdGluZylcclxuICAgICAgICAgICAgICAgIHRvZ2dsZU1lbnVJdGVtczogSlNPTi5zdHJpbmdpZnkoc2Vzc2lvbi5jb25maWc/LnRvZ2dsZU1lbnVJdGVtcyB8fCBbJ2FsbCddKSxcclxuICAgICAgICAgICAgICAgIG5hdlRhYkNvbmZpZzogSlNPTi5zdHJpbmdpZnkoc2Vzc2lvbi5jb25maWc/Lm5hdlRhYkNvbmZpZyB8fCBbXSlcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHJlcy5qc29uKHtcclxuICAgICAgICAgICAgICAgIGNvbmZpZzogZnVsbENvbmZpZyxcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWVcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvciBnZXR0aW5nIHNlc3Npb24gY29uZmlnOicsIGVycm9yKTtcclxuICAgICAgICAgICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnRmFpbGVkIHRvIGdldCBjb25maWcnLFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHVwZGF0ZVNlc3Npb25Db25maWcocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3Qgc2Vzc2lvbklkID0gcmVxLnBhcmFtcy5zZXNzaW9uSWQ7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgY29uZmlnIH0gPSByZXEuYm9keTtcclxuICAgICAgICAgICAgY29uc3Qgc2Vzc2lvbiA9IHRoaXMuc2Vzc2lvbnMuZ2V0KHNlc3Npb25JZCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIXNlc3Npb24pIHtcclxuICAgICAgICAgICAgICAgIHJlcy5zdGF0dXMoNDA0KS5qc29uKHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6ICdTZXNzaW9uIG5vdCBmb3VuZCcgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU2Vzc2lvbkFjdGl2aXR5KHNlc3Npb25JZCk7XHJcblxyXG4gICAgICAgICAgICAvLyBVcGRhdGUgc2Vzc2lvbiBjb25maWdcclxuICAgICAgICAgICAgc2Vzc2lvbi5jb25maWcgPSB7IC4uLnNlc3Npb24uY29uZmlnLCAuLi5jb25maWcgfTtcclxuXHJcbiAgICAgICAgICAgIC8vIFRyaWdnZXIgZGVib3VuY2VkIGRvY3VtZW50YXRpb24gcmVnZW5lcmF0aW9uIHdpdGggbmV3IGNvbmZpZ1xyXG4gICAgICAgICAgICB0aGlzLmdlbmVyYXRlRG9jdW1lbnRhdGlvbihzZXNzaW9uSWQsIHRydWUpO1xyXG5cclxuICAgICAgICAgICAgcmVzLmpzb24oe1xyXG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdDb25maWd1cmF0aW9uIHVwZGF0ZWQgc3VjY2Vzc2Z1bGx5JyxcclxuICAgICAgICAgICAgICAgIGNvbmZpZzogc2Vzc2lvbi5jb25maWdcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvciB1cGRhdGluZyBzZXNzaW9uIGNvbmZpZzonLCBlcnJvcik7XHJcbiAgICAgICAgICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ0ZhaWxlZCB0byB1cGRhdGUgY29uZmlnJyxcclxuICAgICAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzZXJ2ZVNlc3Npb25Eb2NzKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSwgbmV4dDogTmV4dEZ1bmN0aW9uKTogdm9pZCB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3Qgc2Vzc2lvbklkID0gcmVxLnBhcmFtcy5zZXNzaW9uSWQ7XHJcbiAgICAgICAgICAgIGNvbnN0IHNlc3Npb24gPSB0aGlzLnNlc3Npb25zLmdldChzZXNzaW9uSWQpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFzZXNzaW9uKSB7XHJcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzKDQwNCkuanNvbih7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiAnU2Vzc2lvbiBub3QgZm91bmQnIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVNlc3Npb25BY3Rpdml0eShzZXNzaW9uSWQpO1xyXG5cclxuICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBzZXNzaW9uIHBhcnQgZnJvbSB0aGUgVVJMIHRvIGdldCB0aGUgZmlsZSBwYXRoXHJcbiAgICAgICAgICAgIGNvbnN0IGZpbGVQYXRoID0gcmVxLnVybC5yZXBsYWNlKC9eXFwvYXBpXFwvc2Vzc2lvblxcL1teXFwvXStcXC9kb2NzLywgJycpO1xyXG4gICAgICAgICAgICBjb25zdCBmdWxsUGF0aCA9IHBhdGguam9pbihzZXNzaW9uLmRvY3VtZW50YXRpb25EaXIsIGZpbGVQYXRoIHx8ICdpbmRleC5odG1sJyk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhmdWxsUGF0aCkpIHtcclxuICAgICAgICAgICAgICAgIHJlcy5zZW5kRmlsZShmdWxsUGF0aCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzKDQwNCkuc2VuZCgnRG9jdW1lbnRhdGlvbiBmaWxlIG5vdCBmb3VuZCcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdFcnJvciBzZXJ2aW5nIHNlc3Npb24gZG9jczonLCBlcnJvcik7XHJcbiAgICAgICAgICAgIHJlcy5zdGF0dXMoNTAwKS5zZW5kKCdFcnJvciBzZXJ2aW5nIGRvY3VtZW50YXRpb24nKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBpc1BvcnRBdmFpbGFibGUocG9ydDogbnVtYmVyKTogUHJvbWlzZTxib29sZWFuPiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHNlcnZlciA9IGh0dHAuY3JlYXRlU2VydmVyKCk7XHJcbiAgICAgICAgICAgIHNlcnZlci5saXN0ZW4ocG9ydCwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgc2VydmVyLmNsb3NlKCgpID0+IHJlc29sdmUodHJ1ZSkpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgc2VydmVyLm9uKCdlcnJvcicsICgpID0+IHJlc29sdmUoZmFsc2UpKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGZpbmRBdmFpbGFibGVQb3J0KHN0YXJ0UG9ydDogbnVtYmVyKTogUHJvbWlzZTxudW1iZXI+IHtcclxuICAgICAgICBsZXQgcG9ydCA9IHN0YXJ0UG9ydDtcclxuICAgICAgICB3aGlsZSAocG9ydCA8IHN0YXJ0UG9ydCArIDEwMCkgeyAvLyBUcnkgdXAgdG8gMTAwIHBvcnRzIGFib3ZlIHRoZSByZXF1ZXN0ZWQgcG9ydFxyXG4gICAgICAgICAgICBpZiAoYXdhaXQgdGhpcy5pc1BvcnRBdmFpbGFibGUocG9ydCkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwb3J0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHBvcnQrKztcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBhdmFpbGFibGUgcG9ydCBmb3VuZCBpbiByYW5nZSAke3N0YXJ0UG9ydH0tJHtzdGFydFBvcnQgKyA5OX1gKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYXN5bmMgc3RhcnQoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIHJlcXVlc3RlZCBwb3J0IGlzIGF2YWlsYWJsZSwgb3RoZXJ3aXNlIGZpbmQgYW4gYWx0ZXJuYXRpdmVcclxuICAgICAgICAgICAgaWYgKCEoYXdhaXQgdGhpcy5pc1BvcnRBdmFpbGFibGUodGhpcy5wb3J0KSkpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG9yaWdpbmFsUG9ydCA9IHRoaXMucG9ydDtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3J0ID0gYXdhaXQgdGhpcy5maW5kQXZhaWxhYmxlUG9ydCh0aGlzLnBvcnQgKyAxKTtcclxuICAgICAgICAgICAgICAgICAgICBsb2dnZXIud2Fybihg4pqg77iPICBQb3J0ICR7b3JpZ2luYWxQb3J0fSBpcyBpbiB1c2UuIFVzaW5nIHBvcnQgJHt0aGlzLnBvcnR9IGluc3RlYWQuYCk7XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgUG9ydCAke29yaWdpbmFsUG9ydH0gaXMgaW4gdXNlIGFuZCBubyBhbHRlcm5hdGl2ZSBwb3J0IGNvdWxkIGJlIGZvdW5kLiBQbGVhc2Ugc3RvcCB0aGUgcHJvY2VzcyB1c2luZyBwb3J0ICR7b3JpZ2luYWxQb3J0fSBvciBzcGVjaWZ5IGEgZGlmZmVyZW50IHBvcnQuYCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2VydmVyID0gdGhpcy5hcHAubGlzdGVuKHRoaXMucG9ydCwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oYPCfjqggVGVtcGxhdGUgUGxheWdyb3VuZCBpcyBydW5uaW5nIGF0OiBodHRwOi8vbG9jYWxob3N0OiR7dGhpcy5wb3J0fWApO1xyXG4gICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oJ/Cfk50gVXNlIHRoaXMgdG9vbCB0byBjdXN0b21pemUgYW5kIHByZXZpZXcgQ29tcG9kb2MgdGVtcGxhdGVzJyk7XHJcbiAgICAgICAgICAgICAgICBsb2dnZXIuaW5mbygn8J+UpyBFZGl0IHRlbXBsYXRlcyBpbiB0aGUgbGVmdCBwYW5lbCBhbmQgc2VlIGxpdmUgcHJldmlldyBvbiB0aGUgcmlnaHQnKTtcclxuICAgICAgICAgICAgICAgIGxvZ2dlci5pbmZvKCfwn5K+IEV4cG9ydCB5b3VyIGN1c3RvbWl6ZWQgdGVtcGxhdGVzIHdoZW4gcmVhZHknKTtcclxuICAgICAgICAgICAgICAgIGxvZ2dlci5pbmZvKCcnKTtcclxuICAgICAgICAgICAgICAgIGxvZ2dlci5pbmZvKCdQcmVzcyBDdHJsK0MgdG8gc3RvcCB0aGUgc2VydmVyJyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gR3JhY2VmdWwgc2h1dGRvd25cclxuICAgICAgICAgICAgcHJvY2Vzcy5vbignU0lHVEVSTScsIHRoaXMuc3RvcC5iaW5kKHRoaXMpKTtcclxuICAgICAgICAgICAgcHJvY2Vzcy5vbignU0lHSU5UJywgdGhpcy5zdG9wLmJpbmQodGhpcykpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGxvZ2dlci5lcnJvcignRmFpbGVkIHRvIHN0YXJ0IFRlbXBsYXRlIFBsYXlncm91bmQ6JywgZXJyb3IpO1xyXG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0b3AoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBzaWduYWwgaGFuZGxlcnMgdG8gcHJldmVudCBtZW1vcnkgbGVha3NcclxuICAgICAgICAgICAgZm9yIChjb25zdCBbc2lnbmFsLCBoYW5kbGVyXSBvZiB0aGlzLnNpZ25hbEhhbmRsZXJzLmVudHJpZXMoKSkge1xyXG4gICAgICAgICAgICAgICAgcHJvY2Vzcy5yZW1vdmVMaXN0ZW5lcihzaWduYWwsIGhhbmRsZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuc2lnbmFsSGFuZGxlcnMuY2xlYXIoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIENsZWFyIGNsZWFudXAgaW50ZXJ2YWxcclxuICAgICAgICAgICAgaWYgKHRoaXMuY2xlYW51cEludGVydmFsKSB7XHJcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHRoaXMuY2xlYW51cEludGVydmFsKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xlYW51cEludGVydmFsID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gQ2xlYXIgYWxsIGRlYm91bmNlIHRpbWVyc1xyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHRpbWVyIG9mIHRoaXMuZGVib3VuY2VUaW1lcnMudmFsdWVzKCkpIHtcclxuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5kZWJvdW5jZVRpbWVycy5jbGVhcigpO1xyXG5cclxuICAgICAgICAgICAgLy8gQ2xlYW4gdXAgYWxsIHNlc3Npb25zXHJcbiAgICAgICAgICAgIGZvciAoY29uc3Qgc2Vzc2lvbklkIG9mIHRoaXMuc2Vzc2lvbnMua2V5cygpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFudXBTZXNzaW9uKHNlc3Npb25JZCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnNlcnZlcikge1xyXG4gICAgICAgICAgICAgICAgbGV0IHJlc29sdmVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHRoaXMuc2VydmVyLmNsb3NlKChlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghcmVzb2x2ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2dlci53YXJuKCdFcnJvciBjbG9zaW5nIHNlcnZlcjonLCBlcnJvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2dnZXIuaW5mbygnVGVtcGxhdGUgUGxheWdyb3VuZCBzZXJ2ZXIgc3RvcHBlZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gRm9yY2UgY2xvc2UgY29ubmVjdGlvbnMgaWYgc2VydmVyIGRvZXNuJ3QgY2xvc2Ugd2l0aGluIDIgc2Vjb25kc1xyXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXNvbHZlZCAmJiB0aGlzLnNlcnZlcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZ2dlci53YXJuKCdGb3JjZSBjbG9zaW5nIHNlcnZlciBjb25uZWN0aW9ucycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNlcnZlci5jbG9zZUFsbENvbm5lY3Rpb25zPy4oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sIDIwMDApO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBDbGVhbiB1cCB0ZW1wb3JhcnkgZmlsZXNcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIC8vIFRoZSBjbGVhbnVwIGxvZ2ljIGZvciBzZXNzaW9ucyBpcyBub3cgaGFuZGxlZCBieSB0aGUgZGVib3VuY2VUaW1lcnNcclxuICAgICAgICAgICAgICAgIC8vIGFuZCB0aGUgc3RhcnRTZXNzaW9uQ2xlYW51cCBpbnRlcnZhbC5cclxuICAgICAgICAgICAgICAgIC8vIFdlIGNhbiByZW1vdmUgdGhlIGRpcmVjdCBjbGVhbnVwIG9mIHRlbXBQcm9qZWN0UGF0aCBhbmQgb3JpZ2luYWxUZW1wbGF0ZXNQYXRoXHJcbiAgICAgICAgICAgICAgICAvLyBhcyB0aGV5IGFyZSBub3cgbWFuYWdlZCB3aXRoaW4gc2Vzc2lvbnMuXHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBsb2dnZXIud2FybignRmFpbGVkIHRvIGNsZWFuIHVwIHRlbXBvcmFyeSBmaWxlczonLCBlcnJvcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG4iXSwibmFtZXMiOlsiX19hd2FpdGVyIiwibG9nZ2VyIiwicGF0aCIsImZzIiwiY3J5cHRvIiwib3MiLCJfX3ZhbHVlcyIsImV4ZWNTeW5jIiwiX19yZWFkIiwiX19hc3NpZ24iLCJodHRwIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDO0FBT2xDLElBQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUM7QUF1RnBDLElBQUEsd0JBQUEsa0JBQUEsWUFBQTtBQWFJLElBQUEsU0FBQSx3QkFBQSxDQUFZLElBQWEsRUFBQTtBQVJqQixRQUFBLElBQUEsQ0FBQSxRQUFRLEdBQW1DLElBQUksR0FBRyxF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LElBQVAsT0FBTyxLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFQLE9BQU8sQ0FBRSxNQUFNLE1BQUEsSUFBQSxJQUFBLEVBQUEsS0FBQSxLQUFBLENBQUEsR0FBQSxLQUFBLENBQUEsR0FBQSxFQUFBLENBQUUsYUFBYSxLQUFJLEVBQUU7QUFDbkQsd0JBQUEsVUFBVSxFQUFFLENBQUEsQ0FBQSxFQUFBLEdBQUEsT0FBTyxLQUFBLElBQUEsSUFBUCxPQUFPLEtBQUEsS0FBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLEdBQVAsT0FBTyxDQUFFLE1BQU0sTUFBQSxJQUFBLElBQUEsRUFBQSxLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBRSxVQUFVLEtBQUksRUFBRTtBQUM3Qyx3QkFBQSxZQUFZLEVBQUUsQ0FBQSxDQUFBLEVBQUEsR0FBQSxPQUFPLEtBQUEsSUFBQSxJQUFQLE9BQU8sS0FBQSxLQUFBLENBQUEsR0FBQSxLQUFBLENBQUEsR0FBUCxPQUFPLENBQUUsTUFBTSxNQUFBLElBQUEsSUFBQSxFQUFBLEtBQUEsS0FBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFFLFlBQVksS0FBSSxFQUFFO0FBQ2pELHdCQUFBLFFBQVEsRUFBRSxDQUFBLENBQUEsRUFBQSxHQUFBLE9BQU8sS0FBQSxJQUFBLElBQVAsT0FBTyxLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFQLE9BQU8sQ0FBRSxNQUFNLE1BQUEsSUFBQSxJQUFBLEVBQUEsS0FBQSxLQUFBLENBQUEsR0FBQSxLQUFBLENBQUEsR0FBQSxFQUFBLENBQUUsUUFBUSxLQUFJLEVBQUU7O0FBR3pDLHdCQUFBLGlCQUFpQixFQUFFLENBQUEsQ0FBQSxFQUFBLEdBQUEsT0FBTyxLQUFBLElBQUEsSUFBUCxPQUFPLEtBQUEsS0FBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLEdBQVAsT0FBTyxDQUFFLE1BQU0sTUFBQSxJQUFBLElBQUEsRUFBQSxLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBRSxpQkFBaUIsS0FBSSxLQUFLO0FBQzlELHdCQUFBLFlBQVksRUFBRSxDQUFBLENBQUEsRUFBQSxHQUFBLE9BQU8sS0FBQSxJQUFBLElBQVAsT0FBTyxLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFQLE9BQU8sQ0FBRSxNQUFNLE1BQUEsSUFBQSxJQUFBLEVBQUEsS0FBQSxLQUFBLENBQUEsR0FBQSxLQUFBLENBQUEsR0FBQSxFQUFBLENBQUUsWUFBWSxLQUFJLEtBQUs7QUFDcEQsd0JBQUEsZUFBZSxFQUFFLENBQUEsQ0FBQSxFQUFBLEdBQUEsT0FBTyxLQUFBLElBQUEsSUFBUCxPQUFPLEtBQUEsS0FBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLEdBQVAsT0FBTyxDQUFFLE1BQU0sTUFBQSxJQUFBLElBQUEsRUFBQSxLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBRSxlQUFlLEtBQUksS0FBSztBQUMxRCx3QkFBQSxjQUFjLEVBQUUsQ0FBQSxDQUFBLEVBQUEsR0FBQSxPQUFPLEtBQUEsSUFBQSxJQUFQLE9BQU8sS0FBQSxLQUFBLENBQUEsR0FBQSxLQUFBLENBQUEsR0FBUCxPQUFPLENBQUUsTUFBTSxNQUFBLElBQUEsSUFBQSxFQUFBLEtBQUEsS0FBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFFLGNBQWMsS0FBSSxLQUFLO0FBQ3hELHdCQUFBLGdCQUFnQixFQUFFLENBQUEsQ0FBQSxFQUFBLEdBQUEsT0FBTyxLQUFBLElBQUEsSUFBUCxPQUFPLEtBQUEsS0FBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLEdBQVAsT0FBTyxDQUFFLE1BQU0sTUFBQSxJQUFBLElBQUEsRUFBQSxLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBRSxnQkFBZ0IsS0FBSSxLQUFLO0FBQzVELHdCQUFBLGVBQWUsRUFBRSxDQUFBLENBQUEsRUFBQSxHQUFBLE9BQU8sS0FBQSxJQUFBLElBQVAsT0FBTyxLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFQLE9BQU8sQ0FBRSxNQUFNLE1BQUEsSUFBQSxJQUFBLEVBQUEsS0FBQSxLQUFBLENBQUEsR0FBQSxLQUFBLENBQUEsR0FBQSxFQUFBLENBQUUsZUFBZSxLQUFJLEtBQUs7QUFDMUQsd0JBQUEscUJBQXFCLEVBQUUsQ0FBQSxDQUFBLEVBQUEsR0FBQSxPQUFPLEtBQUEsSUFBQSxJQUFQLE9BQU8sS0FBQSxLQUFBLENBQUEsR0FBQSxLQUFBLENBQUEsR0FBUCxPQUFPLENBQUUsTUFBTSxNQUFBLElBQUEsSUFBQSxFQUFBLEtBQUEsS0FBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFFLHFCQUFxQixLQUFJLEtBQUs7QUFDdEUsd0JBQUEsbUJBQW1CLEVBQUUsQ0FBQSxDQUFBLEVBQUEsR0FBQSxPQUFPLEtBQUEsSUFBQSxJQUFQLE9BQU8sS0FBQSxLQUFBLENBQUEsR0FBQSxLQUFBLENBQUEsR0FBUCxPQUFPLENBQUUsTUFBTSxNQUFBLElBQUEsSUFBQSxFQUFBLEtBQUEsS0FBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFFLG1CQUFtQixLQUFJLEtBQUs7QUFDbEUsd0JBQUEsa0JBQWtCLEVBQUUsQ0FBQSxDQUFBLEVBQUEsR0FBQSxPQUFPLEtBQUEsSUFBQSxJQUFQLE9BQU8sS0FBQSxLQUFBLENBQUEsR0FBQSxLQUFBLENBQUEsR0FBUCxPQUFPLENBQUUsTUFBTSxNQUFBLElBQUEsSUFBQSxFQUFBLEtBQUEsS0FBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFFLGtCQUFrQixLQUFJLEtBQUs7QUFDaEUsd0JBQUEsYUFBYSxFQUFFLENBQUEsQ0FBQSxFQUFBLEdBQUEsT0FBTyxLQUFBLElBQUEsSUFBUCxPQUFPLEtBQUEsS0FBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLEdBQVAsT0FBTyxDQUFFLE1BQU0sTUFBQSxJQUFBLElBQUEsRUFBQSxLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBRSxhQUFhLEtBQUksS0FBSztBQUN0RCx3QkFBQSxtQkFBbUIsRUFBRSxDQUFBLENBQUEsRUFBQSxHQUFBLE9BQU8sS0FBQSxJQUFBLElBQVAsT0FBTyxLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFQLE9BQU8sQ0FBRSxNQUFNLE1BQUEsSUFBQSxJQUFBLEVBQUEsS0FBQSxLQUFBLENBQUEsR0FBQSxLQUFBLENBQUEsR0FBQSxFQUFBLENBQUUsbUJBQW1CLEtBQUksS0FBSztBQUNsRSx3QkFBQSxpQkFBaUIsRUFBRSxDQUFBLENBQUEsRUFBQSxHQUFBLE9BQU8sS0FBQSxJQUFBLElBQVAsT0FBTyxLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFQLE9BQU8sQ0FBRSxNQUFNLE1BQUEsSUFBQSxJQUFBLEVBQUEsS0FBQSxLQUFBLENBQUEsR0FBQSxLQUFBLENBQUEsR0FBQSxFQUFBLENBQUUsaUJBQWlCLEtBQUksS0FBSztBQUM5RCx3QkFBQSxjQUFjLEVBQUUsQ0FBQSxDQUFBLEVBQUEsR0FBQSxPQUFPLEtBQUEsSUFBQSxJQUFQLE9BQU8sS0FBQSxLQUFBLENBQUEsR0FBQSxLQUFBLENBQUEsR0FBUCxPQUFPLENBQUUsTUFBTSxNQUFBLElBQUEsSUFBQSxFQUFBLEtBQUEsS0FBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFFLGNBQWMsS0FBSSxLQUFLO0FBQ3hELHdCQUFBLGtCQUFrQixFQUFFLENBQUEsQ0FBQSxFQUFBLEdBQUEsT0FBTyxLQUFBLElBQUEsSUFBUCxPQUFPLEtBQUEsS0FBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLEdBQVAsT0FBTyxDQUFFLE1BQU0sTUFBQSxJQUFBLElBQUEsRUFBQSxLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBRSxrQkFBa0IsS0FBSSxLQUFLO0FBQ2hFLHdCQUFBLGVBQWUsRUFBRSxDQUFBLENBQUEsRUFBQSxHQUFBLE9BQU8sS0FBQSxJQUFBLElBQVAsT0FBTyxLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFQLE9BQU8sQ0FBRSxNQUFNLE1BQUEsSUFBQSxJQUFBLEVBQUEsS0FBQSxLQUFBLENBQUEsR0FBQSxLQUFBLENBQUEsR0FBQSxFQUFBLENBQUUsZUFBZSxLQUFJLEtBQUs7QUFDMUQsd0JBQUEsZ0JBQWdCLEVBQUUsQ0FBQSxDQUFBLEVBQUEsR0FBQSxPQUFPLEtBQUEsSUFBQSxJQUFQLE9BQU8sS0FBQSxLQUFBLENBQUEsR0FBQSxLQUFBLENBQUEsR0FBUCxPQUFPLENBQUUsTUFBTSxNQUFBLElBQUEsSUFBQSxFQUFBLEtBQUEsS0FBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFFLGdCQUFnQixLQUFJLEtBQUs7O0FBRzVELHdCQUFBLGFBQWEsRUFBRSxDQUFBLENBQUEsRUFBQSxHQUFBLE9BQU8sS0FBQSxJQUFBLElBQVAsT0FBTyxLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFQLE9BQU8sQ0FBRSxNQUFNLE1BQUEsSUFBQSxJQUFBLEVBQUEsS0FBQSxLQUFBLENBQUEsR0FBQSxLQUFBLENBQUEsR0FBQSxFQUFBLENBQUUsYUFBYSxLQUFJLEtBQUs7QUFDdEQsd0JBQUEsa0JBQWtCLEVBQUUsQ0FBQSxDQUFBLEVBQUEsR0FBQSxPQUFPLEtBQUEsSUFBQSxJQUFQLE9BQU8sS0FBQSxLQUFBLENBQUEsR0FBQSxLQUFBLENBQUEsR0FBUCxPQUFPLENBQUUsTUFBTSxNQUFBLElBQUEsSUFBQSxFQUFBLEtBQUEsS0FBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFFLGtCQUFrQixLQUFJLEtBQUs7QUFDaEUsd0JBQUEsT0FBTyxFQUFFLENBQUEsQ0FBQSxFQUFBLEdBQUEsT0FBTyxLQUFBLElBQUEsSUFBUCxPQUFPLEtBQUEsS0FBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLEdBQVAsT0FBTyxDQUFFLE1BQU0sTUFBQSxJQUFBLElBQUEsRUFBQSxLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBRSxPQUFPLEtBQUksS0FBSzs7QUFHMUMsd0JBQUEsUUFBUSxFQUFFLENBQUEsQ0FBQSxFQUFBLEdBQUEsT0FBTyxLQUFBLElBQUEsSUFBUCxPQUFPLEtBQUEsS0FBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLEdBQVAsT0FBTyxDQUFFLE1BQU0sTUFBQSxJQUFBLElBQUEsRUFBQSxLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBRSxRQUFRLEtBQUksRUFBRTtBQUN6Qyx3QkFBQSxZQUFZLEVBQUUsQ0FBQSxDQUFBLEVBQUEsR0FBQSxPQUFPLEtBQUEsSUFBQSxJQUFQLE9BQU8sS0FBQSxLQUFBLENBQUEsR0FBQSxLQUFBLENBQUEsR0FBUCxPQUFPLENBQUUsTUFBTSxNQUFBLElBQUEsSUFBQSxFQUFBLEtBQUEsS0FBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFFLFlBQVksS0FBSSwwQkFBMEI7O0FBR3pFLHdCQUFBLElBQUksRUFBRSxDQUFBLENBQUEsRUFBQSxHQUFBLE9BQU8sS0FBQSxJQUFBLElBQVAsT0FBTyxLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFQLE9BQU8sQ0FBRSxNQUFNLE1BQUEsSUFBQSxJQUFBLEVBQUEsS0FBQSxLQUFBLENBQUEsR0FBQSxLQUFBLENBQUEsR0FBQSxFQUFBLENBQUUsSUFBSSxLQUFJLElBQUk7QUFDbkMsd0JBQUEsUUFBUSxFQUFFLENBQUEsQ0FBQSxFQUFBLEdBQUEsT0FBTyxLQUFBLElBQUEsSUFBUCxPQUFPLEtBQUEsS0FBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLEdBQVAsT0FBTyxDQUFFLE1BQU0sTUFBQSxJQUFBLElBQUEsRUFBQSxLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBRSxRQUFRLEtBQUksV0FBVztBQUNsRCx3QkFBQSxLQUFLLEVBQUUsQ0FBQSxDQUFBLEVBQUEsR0FBQSxPQUFPLEtBQUEsSUFBQSxJQUFQLE9BQU8sS0FBQSxLQUFBLENBQUEsR0FBQSxLQUFBLENBQUEsR0FBUCxPQUFPLENBQUUsTUFBTSxNQUFBLElBQUEsSUFBQSxFQUFBLEtBQUEsS0FBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFFLEtBQUssS0FBSSxLQUFLO0FBQ3RDLHdCQUFBLElBQUksRUFBRSxDQUFBLENBQUEsRUFBQSxHQUFBLE9BQU8sS0FBQSxJQUFBLElBQVAsT0FBTyxLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFQLE9BQU8sQ0FBRSxNQUFNLE1BQUEsSUFBQSxJQUFBLEVBQUEsS0FBQSxLQUFBLENBQUEsR0FBQSxLQUFBLENBQUEsR0FBQSxFQUFBLENBQUUsSUFBSSxLQUFJLEtBQUs7QUFDcEMsd0JBQUEsS0FBSyxFQUFFLENBQUEsQ0FBQSxHQUFBLEdBQUEsT0FBTyxLQUFBLElBQUEsSUFBUCxPQUFPLEtBQUEsS0FBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLEdBQVAsT0FBTyxDQUFFLE1BQU0sTUFBQSxJQUFBLElBQUEsR0FBQSxLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFBLEdBQUEsQ0FBRSxLQUFLLEtBQUksS0FBSzs7QUFHdEMsd0JBQUEsWUFBWSxFQUFFLENBQUEsQ0FBQSxHQUFBLEdBQUEsT0FBTyxLQUFBLElBQUEsSUFBUCxPQUFPLEtBQUEsS0FBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLEdBQVAsT0FBTyxDQUFFLE1BQU0sTUFBQSxJQUFBLElBQUEsR0FBQSxLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFBLEdBQUEsQ0FBRSxZQUFZLEtBQUksTUFBTTs7QUFHckQsd0JBQUEsWUFBWSxFQUFFLENBQUEsQ0FBQSxHQUFBLEdBQUEsT0FBTyxLQUFBLElBQUEsSUFBUCxPQUFPLEtBQUEsS0FBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLEdBQVAsT0FBTyxDQUFFLE1BQU0sTUFBQSxJQUFBLElBQUEsR0FBQSxLQUFBLEtBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFBLEdBQUEsQ0FBRSxZQUFZLEtBQUksS0FBSztBQUNw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
