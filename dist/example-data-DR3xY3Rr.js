'use strict';

/**
 * Example data structure for template playground
 * Contains mock data for all supported template types
 */
var EXAMPLE_DATA = {
    component: {
        name: 'UserProfileComponent',
        file: 'src/app/components/user-profile.component.ts',
        deprecated: false,
        selector: 'app-user-profile',
        templateUrl: './user-profile.component.html',
        styleUrls: ['./user-profile.component.scss'],
        description: 'Component for displaying and editing user profile information',
        inputs: [
            {
                name: 'user',
                type: 'User',
                description: 'The user object to display',
                line: 15,
                defaultValue: 'null'
            },
            {
                name: 'editable',
                type: 'boolean',
                description: 'Whether the profile can be edited',
                line: 18,
                defaultValue: 'false'
            }
        ],
        outputs: [
            {
                name: 'userUpdated',
                type: 'EventEmitter<User>',
                description: 'Emitted when user profile is updated',
                line: 21
            }
        ],
        properties: [
            {
                name: 'isLoading',
                type: 'boolean',
                defaultValue: 'false',
                description: 'Loading state indicator',
                line: 25,
                modifierKind: [119] // public
            }
        ],
        methods: [
            {
                name: 'saveProfile',
                type: 'void',
                description: 'Saves the user profile changes',
                line: 30,
                modifierKind: [119], // public
                args: [
                    {
                        name: 'userData',
                        type: 'Partial<User>',
                        description: 'Updated user data'
                    }
                ]
            }
        ],
        implements: ['OnInit', 'OnDestroy'],
        hostListeners: [
            {
                name: 'window:resize',
                args: ['$event'],
                argsDecorator: ['$event'],
                description: 'Handle window resize events'
            }
        ],
        template: '<div class="user-profile">...</div>',
        styles: ['.user-profile { padding: 1rem; }'],
        readme: 'This component provides a comprehensive user profile management interface.',
        navTabs: [
            { href: '#info', id: 'info', label: 'info', 'data-link': 'info' },
            { href: '#readme', id: 'readme', label: 'readme', 'data-link': 'readme' },
            { href: '#source', id: 'source', label: 'source', 'data-link': 'source' },
            { href: '#template', id: 'template', label: 'template', 'data-link': 'template' },
            { href: '#styles', id: 'styles', label: 'styles', 'data-link': 'styles' },
            { href: '#dom-tree', id: 'dom-tree', label: 'dom-tree', 'data-link': 'dom-tree' }
        ]
    },
    module: {
        name: 'UserModule',
        file: 'src/app/modules/user/user.module.ts',
        deprecated: false,
        description: 'Module containing all user-related components and services',
        declarations: [
            { name: 'UserProfileComponent', type: 'component' },
            { name: 'UserListComponent', type: 'component' },
            { name: 'UserDirective', type: 'directive' }
        ],
        imports: [
            { name: 'CommonModule', type: 'module' },
            { name: 'FormsModule', type: 'module' },
            { name: 'HttpClientModule', type: 'module' }
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
        graph: '<svg>...</svg>', // SVG dependency graph
        navTabs: [
            { href: '#info', id: 'info', label: 'info', 'data-link': 'info' },
            { href: '#readme', id: 'readme', label: 'readme', 'data-link': 'readme' },
            { href: '#source', id: 'source', label: 'source', 'data-link': 'source' }
        ]
    },
    interface: {
        name: 'User',
        file: 'src/app/interfaces/user.interface.ts',
        deprecated: false,
        description: 'Interface defining the structure of a user object',
        properties: [
            {
                name: 'id',
                type: 'string',
                description: 'Unique identifier for the user',
                line: 3,
                optional: false
            },
            {
                name: 'email',
                type: 'string',
                description: 'User email address',
                line: 4,
                optional: false
            },
            {
                name: 'firstName',
                type: 'string',
                description: 'User first name',
                line: 5,
                optional: true
            },
            {
                name: 'lastName',
                type: 'string',
                description: 'User last name',
                line: 6,
                optional: true
            },
            {
                name: 'avatar',
                type: 'string',
                description: 'URL to user avatar image',
                line: 7,
                optional: true
            }
        ],
        indexSignatures: [],
        kind: 'interface',
        navTabs: [
            { href: '#info', id: 'info', label: 'info', 'data-link': 'info' },
            { href: '#readme', id: 'readme', label: 'readme', 'data-link': 'readme' },
            { href: '#source', id: 'source', label: 'source', 'data-link': 'source' }
        ]
    },
    class: {
        name: 'UserRepository',
        file: 'src/app/repositories/user.repository.ts',
        deprecated: false,
        description: 'Repository class for managing user data operations',
        constructorObj: {
            name: 'constructor',
            description: 'Creates an instance of UserRepository',
            args: [
                {
                    name: 'httpClient',
                    type: 'HttpClient',
                    description: 'HTTP client for API requests'
                }
            ]
        },
        properties: [
            {
                name: 'baseUrl',
                type: 'string',
                defaultValue: "'/api/users'",
                description: 'Base URL for user API endpoints',
                line: 10,
                modifierKind: [121] // private
            }
        ],
        methods: [
            {
                name: 'getUser',
                type: 'Observable<User>',
                description: 'Retrieves a user by ID',
                line: 15,
                modifierKind: [119], // public
                args: [
                    {
                        name: 'id',
                        type: 'string',
                        description: 'User ID'
                    }
                ]
            },
            {
                name: 'updateUser',
                type: 'Observable<User>',
                description: 'Updates user information',
                line: 20,
                modifierKind: [119], // public
                args: [
                    {
                        name: 'id',
                        type: 'string',
                        description: 'User ID'
                    },
                    {
                        name: 'userData',
                        type: 'Partial<User>',
                        description: 'Updated user data'
                    }
                ]
            }
        ],
        extends: ['BaseRepository'],
        implements: ['UserRepositoryInterface'],
        navTabs: [
            { href: '#info', id: 'info', label: 'info', 'data-link': 'info' },
            { href: '#readme', id: 'readme', label: 'readme', 'data-link': 'readme' },
            { href: '#source', id: 'source', label: 'source', 'data-link': 'source' }
        ]
    },
    injectable: {
        name: 'UserService',
        file: 'src/app/services/user.service.ts',
        deprecated: false,
        description: 'Service for managing user-related business logic',
        properties: [
            {
                name: 'currentUser$',
                type: 'BehaviorSubject<User | null>',
                defaultValue: 'new BehaviorSubject(null)',
                description: 'Observable stream of the current user',
                line: 12,
                modifierKind: [121] // private
            }
        ],
        methods: [
            {
                name: 'getCurrentUser',
                type: 'Observable<User | null>',
                description: 'Returns the current user as an observable',
                line: 18,
                modifierKind: [119] // public
            },
            {
                name: 'login',
                type: 'Observable<User>',
                description: 'Authenticates a user',
                line: 25,
                modifierKind: [119], // public
                args: [
                    {
                        name: 'credentials',
                        type: 'LoginCredentials',
                        description: 'User login credentials'
                    }
                ]
            }
        ],
        constructorObj: {
            name: 'constructor',
            description: 'Creates an instance of UserService',
            args: [
                {
                    name: 'userRepository',
                    type: 'UserRepository',
                    description: 'Repository for user data operations'
                }
            ]
        },
        navTabs: [
            { href: '#info', id: 'info', label: 'info', 'data-link': 'info' },
            { href: '#readme', id: 'readme', label: 'readme', 'data-link': 'readme' },
            { href: '#source', id: 'source', label: 'source', 'data-link': 'source' }
        ]
    },
    directive: {
        name: 'HighlightDirective',
        file: 'src/app/directives/highlight.directive.ts',
        deprecated: false,
        selector: '[appHighlight]',
        description: 'Directive for highlighting elements on hover',
        inputs: [
            {
                name: 'highlightColor',
                type: 'string',
                description: 'Color to use for highlighting',
                line: 10,
                defaultValue: "'yellow'"
            }
        ],
        hostListeners: [
            {
                name: 'mouseenter',
                args: [],
                description: 'Handle mouse enter events'
            },
            {
                name: 'mouseleave',
                args: [],
                description: 'Handle mouse leave events'
            }
        ],
        navTabs: [
            { href: '#info', id: 'info', label: 'info', 'data-link': 'info' },
            { href: '#readme', id: 'readme', label: 'readme', 'data-link': 'readme' },
            { href: '#source', id: 'source', label: 'source', 'data-link': 'source' }
        ]
    },
    pipe: {
        name: 'TruncatePipe',
        file: 'src/app/pipes/truncate.pipe.ts',
        deprecated: false,
        description: 'Pipe for truncating text to a specified length',
        methods: [
            {
                name: 'transform',
                type: 'string',
                description: 'Transforms the input text by truncating it',
                line: 8,
                modifierKind: [119], // public
                args: [
                    {
                        name: 'value',
                        type: 'string',
                        description: 'Text to truncate'
                    },
                    {
                        name: 'limit',
                        type: 'number',
                        description: 'Maximum length'
                    },
                    {
                        name: 'ellipsis',
                        type: 'string',
                        description: 'Ellipsis string to append'
                    }
                ]
            }
        ],
        implements: ['PipeTransform'],
        navTabs: [
            { href: '#info', id: 'info', label: 'info', 'data-link': 'info' },
            { href: '#readme', id: 'readme', label: 'readme', 'data-link': 'readme' },
            { href: '#source', id: 'source', label: 'source', 'data-link': 'source' }
        ]
    },
    guard: {
        name: 'AuthGuard',
        file: 'src/app/guards/auth.guard.ts',
        deprecated: false,
        description: 'Guard for protecting routes that require authentication',
        methods: [
            {
                name: 'canActivate',
                type: 'Observable<boolean> | Promise<boolean> | boolean',
                description: 'Determines if the route can be activated',
                line: 12,
                modifierKind: [119], // public
                args: [
                    {
                        name: 'route',
                        type: 'ActivatedRouteSnapshot',
                        description: 'Current route snapshot'
                    },
                    {
                        name: 'state',
                        type: 'RouterStateSnapshot',
                        description: 'Current router state'
                    }
                ]
            }
        ],
        implements: ['CanActivate'],
        navTabs: [
            { href: '#info', id: 'info', label: 'info', 'data-link': 'info' },
            { href: '#readme', id: 'readme', label: 'readme', 'data-link': 'readme' },
            { href: '#source', id: 'source', label: 'source', 'data-link': 'source' }
        ]
    },
    interceptor: {
        name: 'AuthInterceptor',
        file: 'src/app/interceptors/auth.interceptor.ts',
        deprecated: false,
        description: 'HTTP interceptor for adding authentication headers',
        methods: [
            {
                name: 'intercept',
                type: 'Observable<HttpEvent<any>>',
                description: 'Intercepts HTTP requests to add auth headers',
                line: 10,
                modifierKind: [119], // public
                args: [
                    {
                        name: 'req',
                        type: 'HttpRequest<any>',
                        description: 'HTTP request to intercept'
                    },
                    {
                        name: 'next',
                        type: 'HttpHandler',
                        description: 'Next handler in the chain'
                    }
                ]
            }
        ],
        implements: ['HttpInterceptor'],
        navTabs: [
            { href: '#info', id: 'info', label: 'info', 'data-link': 'info' },
            { href: '#readme', id: 'readme', label: 'readme', 'data-link': 'readme' },
            { href: '#source', id: 'source', label: 'source', 'data-link': 'source' }
        ]
    },
    entity: {
        name: 'UserEntity',
        file: 'src/app/entities/user.entity.ts',
        deprecated: false,
        description: 'Entity class representing a user in the database',
        properties: [
            {
                name: 'id',
                type: 'string',
                description: 'Primary key identifier',
                line: 5,
                decorators: ['@PrimaryGeneratedColumn()']
            },
            {
                name: 'email',
                type: 'string',
                description: 'User email address',
                line: 8,
                decorators: ['@Column({ unique: true })']
            }
        ],
        decorators: ['@Entity()'],
        navTabs: [
            { href: '#info', id: 'info', label: 'info', 'data-link': 'info' },
            { href: '#readme', id: 'readme', label: 'readme', 'data-link': 'readme' },
            { href: '#source', id: 'source', label: 'source', 'data-link': 'source' }
        ]
    },
    controller: {
        name: 'UserController',
        file: 'src/app/controllers/user.controller.ts',
        deprecated: false,
        description: 'REST controller for user operations',
        methods: [
            {
                name: 'getUsers',
                type: 'Promise<User[]>',
                description: 'Get all users',
                line: 12,
                modifierKind: [119], // public
                decorators: ['@Get()']
            },
            {
                name: 'getUserById',
                type: 'Promise<User>',
                description: 'Get user by ID',
                line: 18,
                modifierKind: [119], // public
                decorators: ['@Get(":id")'],
                args: [
                    {
                        name: 'id',
                        type: 'string',
                        description: 'User ID'
                    }
                ]
            }
        ],
        decorators: ['@Controller("users")'],
        navTabs: [
            { href: '#info', id: 'info', label: 'info', 'data-link': 'info' },
            { href: '#readme', id: 'readme', label: 'readme', 'data-link': 'readme' },
            { href: '#source', id: 'source', label: 'source', 'data-link': 'source' }
        ]
    },
    miscellaneous: {
        variables: [
            {
                name: 'API_BASE_URL',
                type: 'string',
                defaultValue: "'https://api.example.com'",
                description: 'Base URL for API endpoints',
                file: 'src/app/constants/api.constants.ts'
            }
        ],
        functions: [
            {
                name: 'formatDate',
                type: '(date: Date, format?: string) => string',
                description: 'Formats a date according to the specified format',
                file: 'src/app/utils/date.utils.ts'
            }
        ],
        typeAliases: [
            {
                name: 'UserId',
                type: 'string',
                description: 'Type alias for user identifier',
                file: 'src/app/types/user.types.ts'
            }
        ],
        enumerations: [
            {
                name: 'UserRole',
                description: 'Enumeration of user roles',
                file: 'src/app/enums/user-role.enum.ts',
                childs: [
                    { name: 'ADMIN', value: 'admin' },
                    { name: 'USER', value: 'user' },
                    { name: 'GUEST', value: 'guest' }
                ]
            }
        ]
    },
    overview: {
        modules: [
            { name: 'AppModule', file: 'src/app/app.module.ts' },
            { name: 'UserModule', file: 'src/app/modules/user/user.module.ts' }
        ],
        components: [
            { name: 'AppComponent', file: 'src/app/app.component.ts' },
            { name: 'UserProfileComponent', file: 'src/app/components/user-profile.component.ts' }
        ],
        injectables: [
            { name: 'UserService', file: 'src/app/services/user.service.ts' }
        ],
        pipes: [
            { name: 'TruncatePipe', file: 'src/app/pipes/truncate.pipe.ts' }
        ],
        directives: [
            { name: 'HighlightDirective', file: 'src/app/directives/highlight.directive.ts' }
        ],
        classes: [
            { name: 'UserRepository', file: 'src/app/repositories/user.repository.ts' }
        ],
        interfaces: [
            { name: 'User', file: 'src/app/interfaces/user.interface.ts' }
        ],
        guards: [
            { name: 'AuthGuard', file: 'src/app/guards/auth.guard.ts' }
        ],
        interceptors: [
            { name: 'AuthInterceptor', file: 'src/app/interceptors/auth.interceptor.ts' }
        ]
    },
    index: {
        modules: 2,
        components: 2,
        injectables: 1,
        pipes: 1,
        directives: 1,
        classes: 1,
        interfaces: 1,
        guards: 1,
        interceptors: 1
    }
};
// Global template context that's available to all templates
var TEMPLATE_CONTEXT = {
    // Translation function
    t: function (key) {
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
            'overview': 'Overview',
            'getting-started': 'Getting Started',
            'properties': 'Properties',
            'methods': 'Methods',
            'inputs': 'Inputs',
            'outputs': 'Outputs',
            'accessors': 'Accessors',
            'constructor': 'Constructor',
            'zoomin': 'Zoom In',
            'zoomout': 'Zoom Out',
            'reset': 'Reset'
        };
        return translations[key] || key;
    },
    // Relative URL helper
    relativeURL: function (depth) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var baseUrl = typeof depth === 'number' ? '../'.repeat(depth) : depth;
        return baseUrl + args.join('/');
    },
    // Template helpers
    compare: function (a, operator, b) {
        switch (operator) {
            case '===': return a === b;
            case '!==': return a !== b;
            case '==': return a == b;
            case '!=': return a != b;
            case '<': return a < b;
            case '>': return a > b;
            case '<=': return a <= b;
            case '>=': return a >= b;
            default: return false;
        }
    },
    // Check if tab is enabled
    isTabEnabled: function (navTabs, tabId) {
        return navTabs.some(function (tab) { return tab.id === tabId; });
    },
    // Check if tab is initial/active
    isInitialTab: function (navTabs, tabId) {
        return navTabs.length > 0 && navTabs[0].id === tabId;
    },
    // Depth for relative URLs
    depth: 0,
    // Global flags
    disableSearch: false,
    disableGraph: false,
    disableCoverage: false,
    disableLifeCycleHooks: false,
    disableProperties: false,
    disableDomTree: false,
    disableTemplateTab: false,
    disableStyleTab: false,
    disablePrivate: false,
    disableProtected: false,
    disableInternal: false
};

exports.EXAMPLE_DATA = EXAMPLE_DATA;
exports.TEMPLATE_CONTEXT = TEMPLATE_CONTEXT;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhhbXBsZS1kYXRhLURSM3hZM1JyLmpzIiwic291cmNlcyI6WyIuLi9zcmMvdGVtcGxhdGUtcGxheWdyb3VuZC9leGFtcGxlLWRhdGEudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIEV4YW1wbGUgZGF0YSBzdHJ1Y3R1cmUgZm9yIHRlbXBsYXRlIHBsYXlncm91bmRcclxuICogQ29udGFpbnMgbW9jayBkYXRhIGZvciBhbGwgc3VwcG9ydGVkIHRlbXBsYXRlIHR5cGVzXHJcbiAqL1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBFeGFtcGxlRGF0YSB7XHJcbiAgICBjb21wb25lbnQ6IGFueTtcclxuICAgIG1vZHVsZTogYW55O1xyXG4gICAgaW50ZXJmYWNlOiBhbnk7XHJcbiAgICBjbGFzczogYW55O1xyXG4gICAgaW5qZWN0YWJsZTogYW55O1xyXG4gICAgZGlyZWN0aXZlOiBhbnk7XHJcbiAgICBwaXBlOiBhbnk7XHJcbiAgICBndWFyZDogYW55O1xyXG4gICAgaW50ZXJjZXB0b3I6IGFueTtcclxuICAgIGVudGl0eTogYW55O1xyXG4gICAgY29udHJvbGxlcjogYW55O1xyXG4gICAgbWlzY2VsbGFuZW91czogYW55O1xyXG4gICAgb3ZlcnZpZXc6IGFueTtcclxuICAgIGluZGV4OiBhbnk7XHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBFWEFNUExFX0RBVEE6IEV4YW1wbGVEYXRhID0ge1xyXG4gICAgY29tcG9uZW50OiB7XHJcbiAgICAgICAgbmFtZTogJ1VzZXJQcm9maWxlQ29tcG9uZW50JyxcclxuICAgICAgICBmaWxlOiAnc3JjL2FwcC9jb21wb25lbnRzL3VzZXItcHJvZmlsZS5jb21wb25lbnQudHMnLFxyXG4gICAgICAgIGRlcHJlY2F0ZWQ6IGZhbHNlLFxyXG4gICAgICAgIHNlbGVjdG9yOiAnYXBwLXVzZXItcHJvZmlsZScsXHJcbiAgICAgICAgdGVtcGxhdGVVcmw6ICcuL3VzZXItcHJvZmlsZS5jb21wb25lbnQuaHRtbCcsXHJcbiAgICAgICAgc3R5bGVVcmxzOiBbJy4vdXNlci1wcm9maWxlLmNvbXBvbmVudC5zY3NzJ10sXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdDb21wb25lbnQgZm9yIGRpc3BsYXlpbmcgYW5kIGVkaXRpbmcgdXNlciBwcm9maWxlIGluZm9ybWF0aW9uJyxcclxuICAgICAgICBpbnB1dHM6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ3VzZXInLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogJ1VzZXInLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdUaGUgdXNlciBvYmplY3QgdG8gZGlzcGxheScsXHJcbiAgICAgICAgICAgICAgICBsaW5lOiAxNSxcclxuICAgICAgICAgICAgICAgIGRlZmF1bHRWYWx1ZTogJ251bGwnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6ICdlZGl0YWJsZScsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1doZXRoZXIgdGhlIHByb2ZpbGUgY2FuIGJlIGVkaXRlZCcsXHJcbiAgICAgICAgICAgICAgICBsaW5lOiAxOCxcclxuICAgICAgICAgICAgICAgIGRlZmF1bHRWYWx1ZTogJ2ZhbHNlJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBvdXRwdXRzOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6ICd1c2VyVXBkYXRlZCcsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnRXZlbnRFbWl0dGVyPFVzZXI+JyxcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRW1pdHRlZCB3aGVuIHVzZXIgcHJvZmlsZSBpcyB1cGRhdGVkJyxcclxuICAgICAgICAgICAgICAgIGxpbmU6IDIxXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdLFxyXG4gICAgICAgIHByb3BlcnRpZXM6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ2lzTG9hZGluZycsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0VmFsdWU6ICdmYWxzZScsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0xvYWRpbmcgc3RhdGUgaW5kaWNhdG9yJyxcclxuICAgICAgICAgICAgICAgIGxpbmU6IDI1LFxyXG4gICAgICAgICAgICAgICAgbW9kaWZpZXJLaW5kOiBbMTE5XSAvLyBwdWJsaWNcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgbWV0aG9kczogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnc2F2ZVByb2ZpbGUnLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogJ3ZvaWQnLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTYXZlcyB0aGUgdXNlciBwcm9maWxlIGNoYW5nZXMnLFxyXG4gICAgICAgICAgICAgICAgbGluZTogMzAsXHJcbiAgICAgICAgICAgICAgICBtb2RpZmllcktpbmQ6IFsxMTldLCAvLyBwdWJsaWNcclxuICAgICAgICAgICAgICAgIGFyZ3M6IFtcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICd1c2VyRGF0YScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdQYXJ0aWFsPFVzZXI+JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdVcGRhdGVkIHVzZXIgZGF0YSdcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdLFxyXG4gICAgICAgIGltcGxlbWVudHM6IFsnT25Jbml0JywgJ09uRGVzdHJveSddLFxyXG4gICAgICAgIGhvc3RMaXN0ZW5lcnM6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ3dpbmRvdzpyZXNpemUnLFxyXG4gICAgICAgICAgICAgICAgYXJnczogWyckZXZlbnQnXSxcclxuICAgICAgICAgICAgICAgIGFyZ3NEZWNvcmF0b3I6IFsnJGV2ZW50J10sXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0hhbmRsZSB3aW5kb3cgcmVzaXplIGV2ZW50cydcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgdGVtcGxhdGU6ICc8ZGl2IGNsYXNzPVwidXNlci1wcm9maWxlXCI+Li4uPC9kaXY+JyxcclxuICAgICAgICBzdHlsZXM6IFsnLnVzZXItcHJvZmlsZSB7IHBhZGRpbmc6IDFyZW07IH0nXSxcclxuICAgICAgICByZWFkbWU6ICdUaGlzIGNvbXBvbmVudCBwcm92aWRlcyBhIGNvbXByZWhlbnNpdmUgdXNlciBwcm9maWxlIG1hbmFnZW1lbnQgaW50ZXJmYWNlLicsXHJcbiAgICAgICAgbmF2VGFiczogW1xyXG4gICAgICAgICAgICB7IGhyZWY6ICcjaW5mbycsIGlkOiAnaW5mbycsIGxhYmVsOiAnaW5mbycsICdkYXRhLWxpbmsnOiAnaW5mbycgfSxcclxuICAgICAgICAgICAgeyBocmVmOiAnI3JlYWRtZScsIGlkOiAncmVhZG1lJywgbGFiZWw6ICdyZWFkbWUnLCAnZGF0YS1saW5rJzogJ3JlYWRtZScgfSxcclxuICAgICAgICAgICAgeyBocmVmOiAnI3NvdXJjZScsIGlkOiAnc291cmNlJywgbGFiZWw6ICdzb3VyY2UnLCAnZGF0YS1saW5rJzogJ3NvdXJjZScgfSxcclxuICAgICAgICAgICAgeyBocmVmOiAnI3RlbXBsYXRlJywgaWQ6ICd0ZW1wbGF0ZScsIGxhYmVsOiAndGVtcGxhdGUnLCAnZGF0YS1saW5rJzogJ3RlbXBsYXRlJyB9LFxyXG4gICAgICAgICAgICB7IGhyZWY6ICcjc3R5bGVzJywgaWQ6ICdzdHlsZXMnLCBsYWJlbDogJ3N0eWxlcycsICdkYXRhLWxpbmsnOiAnc3R5bGVzJyB9LFxyXG4gICAgICAgICAgICB7IGhyZWY6ICcjZG9tLXRyZWUnLCBpZDogJ2RvbS10cmVlJywgbGFiZWw6ICdkb20tdHJlZScsICdkYXRhLWxpbmsnOiAnZG9tLXRyZWUnIH1cclxuICAgICAgICBdXHJcbiAgICB9LFxyXG5cclxuICAgIG1vZHVsZToge1xyXG4gICAgICAgIG5hbWU6ICdVc2VyTW9kdWxlJyxcclxuICAgICAgICBmaWxlOiAnc3JjL2FwcC9tb2R1bGVzL3VzZXIvdXNlci5tb2R1bGUudHMnLFxyXG4gICAgICAgIGRlcHJlY2F0ZWQ6IGZhbHNlLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTW9kdWxlIGNvbnRhaW5pbmcgYWxsIHVzZXItcmVsYXRlZCBjb21wb25lbnRzIGFuZCBzZXJ2aWNlcycsXHJcbiAgICAgICAgZGVjbGFyYXRpb25zOiBbXHJcbiAgICAgICAgICAgIHsgbmFtZTogJ1VzZXJQcm9maWxlQ29tcG9uZW50JywgdHlwZTogJ2NvbXBvbmVudCcgfSxcclxuICAgICAgICAgICAgeyBuYW1lOiAnVXNlckxpc3RDb21wb25lbnQnLCB0eXBlOiAnY29tcG9uZW50JyB9LFxyXG4gICAgICAgICAgICB7IG5hbWU6ICdVc2VyRGlyZWN0aXZlJywgdHlwZTogJ2RpcmVjdGl2ZScgfVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgaW1wb3J0czogW1xyXG4gICAgICAgICAgICB7IG5hbWU6ICdDb21tb25Nb2R1bGUnLCB0eXBlOiAnbW9kdWxlJyB9LFxyXG4gICAgICAgICAgICB7IG5hbWU6ICdGb3Jtc01vZHVsZScsIHR5cGU6ICdtb2R1bGUnIH0sXHJcbiAgICAgICAgICAgIHsgbmFtZTogJ0h0dHBDbGllbnRNb2R1bGUnLCB0eXBlOiAnbW9kdWxlJyB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBleHBvcnRzOiBbXHJcbiAgICAgICAgICAgIHsgbmFtZTogJ1VzZXJQcm9maWxlQ29tcG9uZW50JywgdHlwZTogJ2NvbXBvbmVudCcgfSxcclxuICAgICAgICAgICAgeyBuYW1lOiAnVXNlckxpc3RDb21wb25lbnQnLCB0eXBlOiAnY29tcG9uZW50JyB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBwcm92aWRlcnM6IFtcclxuICAgICAgICAgICAgeyBuYW1lOiAnVXNlclNlcnZpY2UnLCB0eXBlOiAnc2VydmljZScgfSxcclxuICAgICAgICAgICAgeyBuYW1lOiAnVXNlclJlc29sdmVyJywgdHlwZTogJ3Jlc29sdmVyJyB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBib290c3RyYXA6IFtdLFxyXG4gICAgICAgIGdyYXBoOiAnPHN2Zz4uLi48L3N2Zz4nLCAvLyBTVkcgZGVwZW5kZW5jeSBncmFwaFxyXG4gICAgICAgIG5hdlRhYnM6IFtcclxuICAgICAgICAgICAgeyBocmVmOiAnI2luZm8nLCBpZDogJ2luZm8nLCBsYWJlbDogJ2luZm8nLCAnZGF0YS1saW5rJzogJ2luZm8nIH0sXHJcbiAgICAgICAgICAgIHsgaHJlZjogJyNyZWFkbWUnLCBpZDogJ3JlYWRtZScsIGxhYmVsOiAncmVhZG1lJywgJ2RhdGEtbGluayc6ICdyZWFkbWUnIH0sXHJcbiAgICAgICAgICAgIHsgaHJlZjogJyNzb3VyY2UnLCBpZDogJ3NvdXJjZScsIGxhYmVsOiAnc291cmNlJywgJ2RhdGEtbGluayc6ICdzb3VyY2UnIH1cclxuICAgICAgICBdXHJcbiAgICB9LFxyXG5cclxuICAgIGludGVyZmFjZToge1xyXG4gICAgICAgIG5hbWU6ICdVc2VyJyxcclxuICAgICAgICBmaWxlOiAnc3JjL2FwcC9pbnRlcmZhY2VzL3VzZXIuaW50ZXJmYWNlLnRzJyxcclxuICAgICAgICBkZXByZWNhdGVkOiBmYWxzZSxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ0ludGVyZmFjZSBkZWZpbmluZyB0aGUgc3RydWN0dXJlIG9mIGEgdXNlciBvYmplY3QnLFxyXG4gICAgICAgIHByb3BlcnRpZXM6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ2lkJyxcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHVzZXInLFxyXG4gICAgICAgICAgICAgICAgbGluZTogMyxcclxuICAgICAgICAgICAgICAgIG9wdGlvbmFsOiBmYWxzZVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnZW1haWwnLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1VzZXIgZW1haWwgYWRkcmVzcycsXHJcbiAgICAgICAgICAgICAgICBsaW5lOiA0LFxyXG4gICAgICAgICAgICAgICAgb3B0aW9uYWw6IGZhbHNlXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6ICdmaXJzdE5hbWUnLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1VzZXIgZmlyc3QgbmFtZScsXHJcbiAgICAgICAgICAgICAgICBsaW5lOiA1LFxyXG4gICAgICAgICAgICAgICAgb3B0aW9uYWw6IHRydWVcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ2xhc3ROYW1lJyxcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdVc2VyIGxhc3QgbmFtZScsXHJcbiAgICAgICAgICAgICAgICBsaW5lOiA2LFxyXG4gICAgICAgICAgICAgICAgb3B0aW9uYWw6IHRydWVcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ2F2YXRhcicsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVVJMIHRvIHVzZXIgYXZhdGFyIGltYWdlJyxcclxuICAgICAgICAgICAgICAgIGxpbmU6IDcsXHJcbiAgICAgICAgICAgICAgICBvcHRpb25hbDogdHJ1ZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBpbmRleFNpZ25hdHVyZXM6IFtdLFxyXG4gICAgICAgIGtpbmQ6ICdpbnRlcmZhY2UnLFxyXG4gICAgICAgIG5hdlRhYnM6IFtcclxuICAgICAgICAgICAgeyBocmVmOiAnI2luZm8nLCBpZDogJ2luZm8nLCBsYWJlbDogJ2luZm8nLCAnZGF0YS1saW5rJzogJ2luZm8nIH0sXHJcbiAgICAgICAgICAgIHsgaHJlZjogJyNyZWFkbWUnLCBpZDogJ3JlYWRtZScsIGxhYmVsOiAncmVhZG1lJywgJ2RhdGEtbGluayc6ICdyZWFkbWUnIH0sXHJcbiAgICAgICAgICAgIHsgaHJlZjogJyNzb3VyY2UnLCBpZDogJ3NvdXJjZScsIGxhYmVsOiAnc291cmNlJywgJ2RhdGEtbGluayc6ICdzb3VyY2UnIH1cclxuICAgICAgICBdXHJcbiAgICB9LFxyXG5cclxuICAgIGNsYXNzOiB7XHJcbiAgICAgICAgbmFtZTogJ1VzZXJSZXBvc2l0b3J5JyxcclxuICAgICAgICBmaWxlOiAnc3JjL2FwcC9yZXBvc2l0b3JpZXMvdXNlci5yZXBvc2l0b3J5LnRzJyxcclxuICAgICAgICBkZXByZWNhdGVkOiBmYWxzZSxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ1JlcG9zaXRvcnkgY2xhc3MgZm9yIG1hbmFnaW5nIHVzZXIgZGF0YSBvcGVyYXRpb25zJyxcclxuICAgICAgICBjb25zdHJ1Y3Rvck9iajoge1xyXG4gICAgICAgICAgICBuYW1lOiAnY29uc3RydWN0b3InLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0NyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgVXNlclJlcG9zaXRvcnknLFxyXG4gICAgICAgICAgICBhcmdzOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2h0dHBDbGllbnQnLFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdIdHRwQ2xpZW50JyxcclxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0hUVFAgY2xpZW50IGZvciBBUEkgcmVxdWVzdHMnXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHByb3BlcnRpZXM6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ2Jhc2VVcmwnLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0VmFsdWU6IFwiJy9hcGkvdXNlcnMnXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Jhc2UgVVJMIGZvciB1c2VyIEFQSSBlbmRwb2ludHMnLFxyXG4gICAgICAgICAgICAgICAgbGluZTogMTAsXHJcbiAgICAgICAgICAgICAgICBtb2RpZmllcktpbmQ6IFsxMjFdIC8vIHByaXZhdGVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgbWV0aG9kczogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnZ2V0VXNlcicsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnT2JzZXJ2YWJsZTxVc2VyPicsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1JldHJpZXZlcyBhIHVzZXIgYnkgSUQnLFxyXG4gICAgICAgICAgICAgICAgbGluZTogMTUsXHJcbiAgICAgICAgICAgICAgICBtb2RpZmllcktpbmQ6IFsxMTldLCAvLyBwdWJsaWNcclxuICAgICAgICAgICAgICAgIGFyZ3M6IFtcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICdpZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1VzZXIgSUQnXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAndXBkYXRlVXNlcicsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnT2JzZXJ2YWJsZTxVc2VyPicsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1VwZGF0ZXMgdXNlciBpbmZvcm1hdGlvbicsXHJcbiAgICAgICAgICAgICAgICBsaW5lOiAyMCxcclxuICAgICAgICAgICAgICAgIG1vZGlmaWVyS2luZDogWzExOV0sIC8vIHB1YmxpY1xyXG4gICAgICAgICAgICAgICAgYXJnczogW1xyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2lkJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVXNlciBJRCdcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ3VzZXJEYXRhJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ1BhcnRpYWw8VXNlcj4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1VwZGF0ZWQgdXNlciBkYXRhJ1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgZXh0ZW5kczogWydCYXNlUmVwb3NpdG9yeSddLFxyXG4gICAgICAgIGltcGxlbWVudHM6IFsnVXNlclJlcG9zaXRvcnlJbnRlcmZhY2UnXSxcclxuICAgICAgICBuYXZUYWJzOiBbXHJcbiAgICAgICAgICAgIHsgaHJlZjogJyNpbmZvJywgaWQ6ICdpbmZvJywgbGFiZWw6ICdpbmZvJywgJ2RhdGEtbGluayc6ICdpbmZvJyB9LFxyXG4gICAgICAgICAgICB7IGhyZWY6ICcjcmVhZG1lJywgaWQ6ICdyZWFkbWUnLCBsYWJlbDogJ3JlYWRtZScsICdkYXRhLWxpbmsnOiAncmVhZG1lJyB9LFxyXG4gICAgICAgICAgICB7IGhyZWY6ICcjc291cmNlJywgaWQ6ICdzb3VyY2UnLCBsYWJlbDogJ3NvdXJjZScsICdkYXRhLWxpbmsnOiAnc291cmNlJyB9XHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuXHJcbiAgICBpbmplY3RhYmxlOiB7XHJcbiAgICAgICAgbmFtZTogJ1VzZXJTZXJ2aWNlJyxcclxuICAgICAgICBmaWxlOiAnc3JjL2FwcC9zZXJ2aWNlcy91c2VyLnNlcnZpY2UudHMnLFxyXG4gICAgICAgIGRlcHJlY2F0ZWQ6IGZhbHNlLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU2VydmljZSBmb3IgbWFuYWdpbmcgdXNlci1yZWxhdGVkIGJ1c2luZXNzIGxvZ2ljJyxcclxuICAgICAgICBwcm9wZXJ0aWVzOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6ICdjdXJyZW50VXNlciQnLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogJ0JlaGF2aW9yU3ViamVjdDxVc2VyIHwgbnVsbD4nLFxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdFZhbHVlOiAnbmV3IEJlaGF2aW9yU3ViamVjdChudWxsKScsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ09ic2VydmFibGUgc3RyZWFtIG9mIHRoZSBjdXJyZW50IHVzZXInLFxyXG4gICAgICAgICAgICAgICAgbGluZTogMTIsXHJcbiAgICAgICAgICAgICAgICBtb2RpZmllcktpbmQ6IFsxMjFdIC8vIHByaXZhdGVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgbWV0aG9kczogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnZ2V0Q3VycmVudFVzZXInLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogJ09ic2VydmFibGU8VXNlciB8IG51bGw+JyxcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUmV0dXJucyB0aGUgY3VycmVudCB1c2VyIGFzIGFuIG9ic2VydmFibGUnLFxyXG4gICAgICAgICAgICAgICAgbGluZTogMTgsXHJcbiAgICAgICAgICAgICAgICBtb2RpZmllcktpbmQ6IFsxMTldIC8vIHB1YmxpY1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnbG9naW4nLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogJ09ic2VydmFibGU8VXNlcj4nLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBdXRoZW50aWNhdGVzIGEgdXNlcicsXHJcbiAgICAgICAgICAgICAgICBsaW5lOiAyNSxcclxuICAgICAgICAgICAgICAgIG1vZGlmaWVyS2luZDogWzExOV0sIC8vIHB1YmxpY1xyXG4gICAgICAgICAgICAgICAgYXJnczogW1xyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2NyZWRlbnRpYWxzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ0xvZ2luQ3JlZGVudGlhbHMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1VzZXIgbG9naW4gY3JlZGVudGlhbHMnXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBjb25zdHJ1Y3Rvck9iajoge1xyXG4gICAgICAgICAgICBuYW1lOiAnY29uc3RydWN0b3InLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0NyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgVXNlclNlcnZpY2UnLFxyXG4gICAgICAgICAgICBhcmdzOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJ3VzZXJSZXBvc2l0b3J5JyxcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnVXNlclJlcG9zaXRvcnknLFxyXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUmVwb3NpdG9yeSBmb3IgdXNlciBkYXRhIG9wZXJhdGlvbnMnXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9LFxyXG4gICAgICAgIG5hdlRhYnM6IFtcclxuICAgICAgICAgICAgeyBocmVmOiAnI2luZm8nLCBpZDogJ2luZm8nLCBsYWJlbDogJ2luZm8nLCAnZGF0YS1saW5rJzogJ2luZm8nIH0sXHJcbiAgICAgICAgICAgIHsgaHJlZjogJyNyZWFkbWUnLCBpZDogJ3JlYWRtZScsIGxhYmVsOiAncmVhZG1lJywgJ2RhdGEtbGluayc6ICdyZWFkbWUnIH0sXHJcbiAgICAgICAgICAgIHsgaHJlZjogJyNzb3VyY2UnLCBpZDogJ3NvdXJjZScsIGxhYmVsOiAnc291cmNlJywgJ2RhdGEtbGluayc6ICdzb3VyY2UnIH1cclxuICAgICAgICBdXHJcbiAgICB9LFxyXG5cclxuICAgIGRpcmVjdGl2ZToge1xyXG4gICAgICAgIG5hbWU6ICdIaWdobGlnaHREaXJlY3RpdmUnLFxyXG4gICAgICAgIGZpbGU6ICdzcmMvYXBwL2RpcmVjdGl2ZXMvaGlnaGxpZ2h0LmRpcmVjdGl2ZS50cycsXHJcbiAgICAgICAgZGVwcmVjYXRlZDogZmFsc2UsXHJcbiAgICAgICAgc2VsZWN0b3I6ICdbYXBwSGlnaGxpZ2h0XScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdEaXJlY3RpdmUgZm9yIGhpZ2hsaWdodGluZyBlbGVtZW50cyBvbiBob3ZlcicsXHJcbiAgICAgICAgaW5wdXRzOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6ICdoaWdobGlnaHRDb2xvcicsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ29sb3IgdG8gdXNlIGZvciBoaWdobGlnaHRpbmcnLFxyXG4gICAgICAgICAgICAgICAgbGluZTogMTAsXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0VmFsdWU6IFwiJ3llbGxvdydcIlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBob3N0TGlzdGVuZXJzOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6ICdtb3VzZWVudGVyJyxcclxuICAgICAgICAgICAgICAgIGFyZ3M6IFtdLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdIYW5kbGUgbW91c2UgZW50ZXIgZXZlbnRzJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnbW91c2VsZWF2ZScsXHJcbiAgICAgICAgICAgICAgICBhcmdzOiBbXSxcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSGFuZGxlIG1vdXNlIGxlYXZlIGV2ZW50cydcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgbmF2VGFiczogW1xyXG4gICAgICAgICAgICB7IGhyZWY6ICcjaW5mbycsIGlkOiAnaW5mbycsIGxhYmVsOiAnaW5mbycsICdkYXRhLWxpbmsnOiAnaW5mbycgfSxcclxuICAgICAgICAgICAgeyBocmVmOiAnI3JlYWRtZScsIGlkOiAncmVhZG1lJywgbGFiZWw6ICdyZWFkbWUnLCAnZGF0YS1saW5rJzogJ3JlYWRtZScgfSxcclxuICAgICAgICAgICAgeyBocmVmOiAnI3NvdXJjZScsIGlkOiAnc291cmNlJywgbGFiZWw6ICdzb3VyY2UnLCAnZGF0YS1saW5rJzogJ3NvdXJjZScgfVxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcblxyXG4gICAgcGlwZToge1xyXG4gICAgICAgIG5hbWU6ICdUcnVuY2F0ZVBpcGUnLFxyXG4gICAgICAgIGZpbGU6ICdzcmMvYXBwL3BpcGVzL3RydW5jYXRlLnBpcGUudHMnLFxyXG4gICAgICAgIGRlcHJlY2F0ZWQ6IGZhbHNlLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnUGlwZSBmb3IgdHJ1bmNhdGluZyB0ZXh0IHRvIGEgc3BlY2lmaWVkIGxlbmd0aCcsXHJcbiAgICAgICAgbWV0aG9kczogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAndHJhbnNmb3JtJyxcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdUcmFuc2Zvcm1zIHRoZSBpbnB1dCB0ZXh0IGJ5IHRydW5jYXRpbmcgaXQnLFxyXG4gICAgICAgICAgICAgICAgbGluZTogOCxcclxuICAgICAgICAgICAgICAgIG1vZGlmaWVyS2luZDogWzExOV0sIC8vIHB1YmxpY1xyXG4gICAgICAgICAgICAgICAgYXJnczogW1xyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ3ZhbHVlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVGV4dCB0byB0cnVuY2F0ZSdcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2xpbWl0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ251bWJlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTWF4aW11bSBsZW5ndGgnXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICdlbGxpcHNpcycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0VsbGlwc2lzIHN0cmluZyB0byBhcHBlbmQnXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBpbXBsZW1lbnRzOiBbJ1BpcGVUcmFuc2Zvcm0nXSxcclxuICAgICAgICBuYXZUYWJzOiBbXHJcbiAgICAgICAgICAgIHsgaHJlZjogJyNpbmZvJywgaWQ6ICdpbmZvJywgbGFiZWw6ICdpbmZvJywgJ2RhdGEtbGluayc6ICdpbmZvJyB9LFxyXG4gICAgICAgICAgICB7IGhyZWY6ICcjcmVhZG1lJywgaWQ6ICdyZWFkbWUnLCBsYWJlbDogJ3JlYWRtZScsICdkYXRhLWxpbmsnOiAncmVhZG1lJyB9LFxyXG4gICAgICAgICAgICB7IGhyZWY6ICcjc291cmNlJywgaWQ6ICdzb3VyY2UnLCBsYWJlbDogJ3NvdXJjZScsICdkYXRhLWxpbmsnOiAnc291cmNlJyB9XHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuXHJcbiAgICBndWFyZDoge1xyXG4gICAgICAgIG5hbWU6ICdBdXRoR3VhcmQnLFxyXG4gICAgICAgIGZpbGU6ICdzcmMvYXBwL2d1YXJkcy9hdXRoLmd1YXJkLnRzJyxcclxuICAgICAgICBkZXByZWNhdGVkOiBmYWxzZSxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ0d1YXJkIGZvciBwcm90ZWN0aW5nIHJvdXRlcyB0aGF0IHJlcXVpcmUgYXV0aGVudGljYXRpb24nLFxyXG4gICAgICAgIG1ldGhvZHM6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ2NhbkFjdGl2YXRlJyxcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdPYnNlcnZhYmxlPGJvb2xlYW4+IHwgUHJvbWlzZTxib29sZWFuPiB8IGJvb2xlYW4nLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdEZXRlcm1pbmVzIGlmIHRoZSByb3V0ZSBjYW4gYmUgYWN0aXZhdGVkJyxcclxuICAgICAgICAgICAgICAgIGxpbmU6IDEyLFxyXG4gICAgICAgICAgICAgICAgbW9kaWZpZXJLaW5kOiBbMTE5XSwgLy8gcHVibGljXHJcbiAgICAgICAgICAgICAgICBhcmdzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAncm91dGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnQWN0aXZhdGVkUm91dGVTbmFwc2hvdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ3VycmVudCByb3V0ZSBzbmFwc2hvdCdcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ3N0YXRlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ1JvdXRlclN0YXRlU25hcHNob3QnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0N1cnJlbnQgcm91dGVyIHN0YXRlJ1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgaW1wbGVtZW50czogWydDYW5BY3RpdmF0ZSddLFxyXG4gICAgICAgIG5hdlRhYnM6IFtcclxuICAgICAgICAgICAgeyBocmVmOiAnI2luZm8nLCBpZDogJ2luZm8nLCBsYWJlbDogJ2luZm8nLCAnZGF0YS1saW5rJzogJ2luZm8nIH0sXHJcbiAgICAgICAgICAgIHsgaHJlZjogJyNyZWFkbWUnLCBpZDogJ3JlYWRtZScsIGxhYmVsOiAncmVhZG1lJywgJ2RhdGEtbGluayc6ICdyZWFkbWUnIH0sXHJcbiAgICAgICAgICAgIHsgaHJlZjogJyNzb3VyY2UnLCBpZDogJ3NvdXJjZScsIGxhYmVsOiAnc291cmNlJywgJ2RhdGEtbGluayc6ICdzb3VyY2UnIH1cclxuICAgICAgICBdXHJcbiAgICB9LFxyXG5cclxuICAgIGludGVyY2VwdG9yOiB7XHJcbiAgICAgICAgbmFtZTogJ0F1dGhJbnRlcmNlcHRvcicsXHJcbiAgICAgICAgZmlsZTogJ3NyYy9hcHAvaW50ZXJjZXB0b3JzL2F1dGguaW50ZXJjZXB0b3IudHMnLFxyXG4gICAgICAgIGRlcHJlY2F0ZWQ6IGZhbHNlLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnSFRUUCBpbnRlcmNlcHRvciBmb3IgYWRkaW5nIGF1dGhlbnRpY2F0aW9uIGhlYWRlcnMnLFxyXG4gICAgICAgIG1ldGhvZHM6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ2ludGVyY2VwdCcsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnT2JzZXJ2YWJsZTxIdHRwRXZlbnQ8YW55Pj4nLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdJbnRlcmNlcHRzIEhUVFAgcmVxdWVzdHMgdG8gYWRkIGF1dGggaGVhZGVycycsXHJcbiAgICAgICAgICAgICAgICBsaW5lOiAxMCxcclxuICAgICAgICAgICAgICAgIG1vZGlmaWVyS2luZDogWzExOV0sIC8vIHB1YmxpY1xyXG4gICAgICAgICAgICAgICAgYXJnczogW1xyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ3JlcScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdIdHRwUmVxdWVzdDxhbnk+JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdIVFRQIHJlcXVlc3QgdG8gaW50ZXJjZXB0J1xyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnbmV4dCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdIdHRwSGFuZGxlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTmV4dCBoYW5kbGVyIGluIHRoZSBjaGFpbidcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdLFxyXG4gICAgICAgIGltcGxlbWVudHM6IFsnSHR0cEludGVyY2VwdG9yJ10sXHJcbiAgICAgICAgbmF2VGFiczogW1xyXG4gICAgICAgICAgICB7IGhyZWY6ICcjaW5mbycsIGlkOiAnaW5mbycsIGxhYmVsOiAnaW5mbycsICdkYXRhLWxpbmsnOiAnaW5mbycgfSxcclxuICAgICAgICAgICAgeyBocmVmOiAnI3JlYWRtZScsIGlkOiAncmVhZG1lJywgbGFiZWw6ICdyZWFkbWUnLCAnZGF0YS1saW5rJzogJ3JlYWRtZScgfSxcclxuICAgICAgICAgICAgeyBocmVmOiAnI3NvdXJjZScsIGlkOiAnc291cmNlJywgbGFiZWw6ICdzb3VyY2UnLCAnZGF0YS1saW5rJzogJ3NvdXJjZScgfVxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcblxyXG4gICAgZW50aXR5OiB7XHJcbiAgICAgICAgbmFtZTogJ1VzZXJFbnRpdHknLFxyXG4gICAgICAgIGZpbGU6ICdzcmMvYXBwL2VudGl0aWVzL3VzZXIuZW50aXR5LnRzJyxcclxuICAgICAgICBkZXByZWNhdGVkOiBmYWxzZSxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ0VudGl0eSBjbGFzcyByZXByZXNlbnRpbmcgYSB1c2VyIGluIHRoZSBkYXRhYmFzZScsXHJcbiAgICAgICAgcHJvcGVydGllczogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnaWQnLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1ByaW1hcnkga2V5IGlkZW50aWZpZXInLFxyXG4gICAgICAgICAgICAgICAgbGluZTogNSxcclxuICAgICAgICAgICAgICAgIGRlY29yYXRvcnM6IFsnQFByaW1hcnlHZW5lcmF0ZWRDb2x1bW4oKSddXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6ICdlbWFpbCcsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVXNlciBlbWFpbCBhZGRyZXNzJyxcclxuICAgICAgICAgICAgICAgIGxpbmU6IDgsXHJcbiAgICAgICAgICAgICAgICBkZWNvcmF0b3JzOiBbJ0BDb2x1bW4oeyB1bmlxdWU6IHRydWUgfSknXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBkZWNvcmF0b3JzOiBbJ0BFbnRpdHkoKSddLFxyXG4gICAgICAgIG5hdlRhYnM6IFtcclxuICAgICAgICAgICAgeyBocmVmOiAnI2luZm8nLCBpZDogJ2luZm8nLCBsYWJlbDogJ2luZm8nLCAnZGF0YS1saW5rJzogJ2luZm8nIH0sXHJcbiAgICAgICAgICAgIHsgaHJlZjogJyNyZWFkbWUnLCBpZDogJ3JlYWRtZScsIGxhYmVsOiAncmVhZG1lJywgJ2RhdGEtbGluayc6ICdyZWFkbWUnIH0sXHJcbiAgICAgICAgICAgIHsgaHJlZjogJyNzb3VyY2UnLCBpZDogJ3NvdXJjZScsIGxhYmVsOiAnc291cmNlJywgJ2RhdGEtbGluayc6ICdzb3VyY2UnIH1cclxuICAgICAgICBdXHJcbiAgICB9LFxyXG5cclxuICAgIGNvbnRyb2xsZXI6IHtcclxuICAgICAgICBuYW1lOiAnVXNlckNvbnRyb2xsZXInLFxyXG4gICAgICAgIGZpbGU6ICdzcmMvYXBwL2NvbnRyb2xsZXJzL3VzZXIuY29udHJvbGxlci50cycsXHJcbiAgICAgICAgZGVwcmVjYXRlZDogZmFsc2UsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdSRVNUIGNvbnRyb2xsZXIgZm9yIHVzZXIgb3BlcmF0aW9ucycsXHJcbiAgICAgICAgbWV0aG9kczogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnZ2V0VXNlcnMnLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogJ1Byb21pc2U8VXNlcltdPicsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0dldCBhbGwgdXNlcnMnLFxyXG4gICAgICAgICAgICAgICAgbGluZTogMTIsXHJcbiAgICAgICAgICAgICAgICBtb2RpZmllcktpbmQ6IFsxMTldLCAvLyBwdWJsaWNcclxuICAgICAgICAgICAgICAgIGRlY29yYXRvcnM6IFsnQEdldCgpJ11cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ2dldFVzZXJCeUlkJyxcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdQcm9taXNlPFVzZXI+JyxcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnR2V0IHVzZXIgYnkgSUQnLFxyXG4gICAgICAgICAgICAgICAgbGluZTogMTgsXHJcbiAgICAgICAgICAgICAgICBtb2RpZmllcktpbmQ6IFsxMTldLCAvLyBwdWJsaWNcclxuICAgICAgICAgICAgICAgIGRlY29yYXRvcnM6IFsnQEdldChcIjppZFwiKSddLFxyXG4gICAgICAgICAgICAgICAgYXJnczogW1xyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ2lkJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVXNlciBJRCdcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdLFxyXG4gICAgICAgIGRlY29yYXRvcnM6IFsnQENvbnRyb2xsZXIoXCJ1c2Vyc1wiKSddLFxyXG4gICAgICAgIG5hdlRhYnM6IFtcclxuICAgICAgICAgICAgeyBocmVmOiAnI2luZm8nLCBpZDogJ2luZm8nLCBsYWJlbDogJ2luZm8nLCAnZGF0YS1saW5rJzogJ2luZm8nIH0sXHJcbiAgICAgICAgICAgIHsgaHJlZjogJyNyZWFkbWUnLCBpZDogJ3JlYWRtZScsIGxhYmVsOiAncmVhZG1lJywgJ2RhdGEtbGluayc6ICdyZWFkbWUnIH0sXHJcbiAgICAgICAgICAgIHsgaHJlZjogJyNzb3VyY2UnLCBpZDogJ3NvdXJjZScsIGxhYmVsOiAnc291cmNlJywgJ2RhdGEtbGluayc6ICdzb3VyY2UnIH1cclxuICAgICAgICBdXHJcbiAgICB9LFxyXG5cclxuICAgIG1pc2NlbGxhbmVvdXM6IHtcclxuICAgICAgICB2YXJpYWJsZXM6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ0FQSV9CQVNFX1VSTCcsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcclxuICAgICAgICAgICAgICAgIGRlZmF1bHRWYWx1ZTogXCInaHR0cHM6Ly9hcGkuZXhhbXBsZS5jb20nXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Jhc2UgVVJMIGZvciBBUEkgZW5kcG9pbnRzJyxcclxuICAgICAgICAgICAgICAgIGZpbGU6ICdzcmMvYXBwL2NvbnN0YW50cy9hcGkuY29uc3RhbnRzLnRzJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBmdW5jdGlvbnM6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ2Zvcm1hdERhdGUnLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogJyhkYXRlOiBEYXRlLCBmb3JtYXQ/OiBzdHJpbmcpID0+IHN0cmluZycsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Zvcm1hdHMgYSBkYXRlIGFjY29yZGluZyB0byB0aGUgc3BlY2lmaWVkIGZvcm1hdCcsXHJcbiAgICAgICAgICAgICAgICBmaWxlOiAnc3JjL2FwcC91dGlscy9kYXRlLnV0aWxzLnRzJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICB0eXBlQWxpYXNlczogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnVXNlcklkJyxcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdUeXBlIGFsaWFzIGZvciB1c2VyIGlkZW50aWZpZXInLFxyXG4gICAgICAgICAgICAgICAgZmlsZTogJ3NyYy9hcHAvdHlwZXMvdXNlci50eXBlcy50cydcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgZW51bWVyYXRpb25zOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6ICdVc2VyUm9sZScsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0VudW1lcmF0aW9uIG9mIHVzZXIgcm9sZXMnLFxyXG4gICAgICAgICAgICAgICAgZmlsZTogJ3NyYy9hcHAvZW51bXMvdXNlci1yb2xlLmVudW0udHMnLFxyXG4gICAgICAgICAgICAgICAgY2hpbGRzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgeyBuYW1lOiAnQURNSU4nLCB2YWx1ZTogJ2FkbWluJyB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ1VTRVInLCB2YWx1ZTogJ3VzZXInIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgeyBuYW1lOiAnR1VFU1QnLCB2YWx1ZTogJ2d1ZXN0JyB9XHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdXHJcbiAgICB9LFxyXG5cclxuICAgIG92ZXJ2aWV3OiB7XHJcbiAgICAgICAgbW9kdWxlczogW1xyXG4gICAgICAgICAgICB7IG5hbWU6ICdBcHBNb2R1bGUnLCBmaWxlOiAnc3JjL2FwcC9hcHAubW9kdWxlLnRzJyB9LFxyXG4gICAgICAgICAgICB7IG5hbWU6ICdVc2VyTW9kdWxlJywgZmlsZTogJ3NyYy9hcHAvbW9kdWxlcy91c2VyL3VzZXIubW9kdWxlLnRzJyB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBjb21wb25lbnRzOiBbXHJcbiAgICAgICAgICAgIHsgbmFtZTogJ0FwcENvbXBvbmVudCcsIGZpbGU6ICdzcmMvYXBwL2FwcC5jb21wb25lbnQudHMnIH0sXHJcbiAgICAgICAgICAgIHsgbmFtZTogJ1VzZXJQcm9maWxlQ29tcG9uZW50JywgZmlsZTogJ3NyYy9hcHAvY29tcG9uZW50cy91c2VyLXByb2ZpbGUuY29tcG9uZW50LnRzJyB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBpbmplY3RhYmxlczogW1xyXG4gICAgICAgICAgICB7IG5hbWU6ICdVc2VyU2VydmljZScsIGZpbGU6ICdzcmMvYXBwL3NlcnZpY2VzL3VzZXIuc2VydmljZS50cycgfVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgcGlwZXM6IFtcclxuICAgICAgICAgICAgeyBuYW1lOiAnVHJ1bmNhdGVQaXBlJywgZmlsZTogJ3NyYy9hcHAvcGlwZXMvdHJ1bmNhdGUucGlwZS50cycgfVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgZGlyZWN0aXZlczogW1xyXG4gICAgICAgICAgICB7IG5hbWU6ICdIaWdobGlnaHREaXJlY3RpdmUnLCBmaWxlOiAnc3JjL2FwcC9kaXJlY3RpdmVzL2hpZ2hsaWdodC5kaXJlY3RpdmUudHMnIH1cclxuICAgICAgICBdLFxyXG4gICAgICAgIGNsYXNzZXM6IFtcclxuICAgICAgICAgICAgeyBuYW1lOiAnVXNlclJlcG9zaXRvcnknLCBmaWxlOiAnc3JjL2FwcC9yZXBvc2l0b3JpZXMvdXNlci5yZXBvc2l0b3J5LnRzJyB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBpbnRlcmZhY2VzOiBbXHJcbiAgICAgICAgICAgIHsgbmFtZTogJ1VzZXInLCBmaWxlOiAnc3JjL2FwcC9pbnRlcmZhY2VzL3VzZXIuaW50ZXJmYWNlLnRzJyB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBndWFyZHM6IFtcclxuICAgICAgICAgICAgeyBuYW1lOiAnQXV0aEd1YXJkJywgZmlsZTogJ3NyYy9hcHAvZ3VhcmRzL2F1dGguZ3VhcmQudHMnIH1cclxuICAgICAgICBdLFxyXG4gICAgICAgIGludGVyY2VwdG9yczogW1xyXG4gICAgICAgICAgICB7IG5hbWU6ICdBdXRoSW50ZXJjZXB0b3InLCBmaWxlOiAnc3JjL2FwcC9pbnRlcmNlcHRvcnMvYXV0aC5pbnRlcmNlcHRvci50cycgfVxyXG4gICAgICAgIF1cclxuICAgIH0sXHJcblxyXG4gICAgaW5kZXg6IHtcclxuICAgICAgICBtb2R1bGVzOiAyLFxyXG4gICAgICAgIGNvbXBvbmVudHM6IDIsXHJcbiAgICAgICAgaW5qZWN0YWJsZXM6IDEsXHJcbiAgICAgICAgcGlwZXM6IDEsXHJcbiAgICAgICAgZGlyZWN0aXZlczogMSxcclxuICAgICAgICBjbGFzc2VzOiAxLFxyXG4gICAgICAgIGludGVyZmFjZXM6IDEsXHJcbiAgICAgICAgZ3VhcmRzOiAxLFxyXG4gICAgICAgIGludGVyY2VwdG9yczogMVxyXG4gICAgfVxyXG59O1xyXG5cclxuLy8gR2xvYmFsIHRlbXBsYXRlIGNvbnRleHQgdGhhdCdzIGF2YWlsYWJsZSB0byBhbGwgdGVtcGxhdGVzXHJcbmV4cG9ydCBjb25zdCBURU1QTEFURV9DT05URVhUID0ge1xyXG4gICAgLy8gVHJhbnNsYXRpb24gZnVuY3Rpb25cclxuICAgIHQ6IChrZXk6IHN0cmluZykgPT4ge1xyXG4gICAgICAgIGNvbnN0IHRyYW5zbGF0aW9uczogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfSA9IHtcclxuICAgICAgICAgICAgJ2NvbXBvbmVudHMnOiAnQ29tcG9uZW50cycsXHJcbiAgICAgICAgICAgICdtb2R1bGVzJzogJ01vZHVsZXMnLFxyXG4gICAgICAgICAgICAnaW50ZXJmYWNlcyc6ICdJbnRlcmZhY2VzJyxcclxuICAgICAgICAgICAgJ2NsYXNzZXMnOiAnQ2xhc3NlcycsXHJcbiAgICAgICAgICAgICdpbmplY3RhYmxlcyc6ICdJbmplY3RhYmxlcycsXHJcbiAgICAgICAgICAgICdwaXBlcyc6ICdQaXBlcycsXHJcbiAgICAgICAgICAgICdkaXJlY3RpdmVzJzogJ0RpcmVjdGl2ZXMnLFxyXG4gICAgICAgICAgICAnZ3VhcmRzJzogJ0d1YXJkcycsXHJcbiAgICAgICAgICAgICdpbnRlcmNlcHRvcnMnOiAnSW50ZXJjZXB0b3JzJyxcclxuICAgICAgICAgICAgJ2VudGl0aWVzJzogJ0VudGl0aWVzJyxcclxuICAgICAgICAgICAgJ2NvbnRyb2xsZXJzJzogJ0NvbnRyb2xsZXJzJyxcclxuICAgICAgICAgICAgJ2luZm8nOiAnSW5mbycsXHJcbiAgICAgICAgICAgICdyZWFkbWUnOiAnUmVhZG1lJyxcclxuICAgICAgICAgICAgJ3NvdXJjZSc6ICdTb3VyY2UnLFxyXG4gICAgICAgICAgICAndGVtcGxhdGUnOiAnVGVtcGxhdGUnLFxyXG4gICAgICAgICAgICAnc3R5bGVzJzogJ1N0eWxlcycsXHJcbiAgICAgICAgICAgICdkb20tdHJlZSc6ICdET00gVHJlZScsXHJcbiAgICAgICAgICAgICdmaWxlJzogJ0ZpbGUnLFxyXG4gICAgICAgICAgICAnb3ZlcnZpZXcnOiAnT3ZlcnZpZXcnLFxyXG4gICAgICAgICAgICAnZ2V0dGluZy1zdGFydGVkJzogJ0dldHRpbmcgU3RhcnRlZCcsXHJcbiAgICAgICAgICAgICdwcm9wZXJ0aWVzJzogJ1Byb3BlcnRpZXMnLFxyXG4gICAgICAgICAgICAnbWV0aG9kcyc6ICdNZXRob2RzJyxcclxuICAgICAgICAgICAgJ2lucHV0cyc6ICdJbnB1dHMnLFxyXG4gICAgICAgICAgICAnb3V0cHV0cyc6ICdPdXRwdXRzJyxcclxuICAgICAgICAgICAgJ2FjY2Vzc29ycyc6ICdBY2Nlc3NvcnMnLFxyXG4gICAgICAgICAgICAnY29uc3RydWN0b3InOiAnQ29uc3RydWN0b3InLFxyXG4gICAgICAgICAgICAnem9vbWluJzogJ1pvb20gSW4nLFxyXG4gICAgICAgICAgICAnem9vbW91dCc6ICdab29tIE91dCcsXHJcbiAgICAgICAgICAgICdyZXNldCc6ICdSZXNldCdcclxuICAgICAgICB9O1xyXG4gICAgICAgIHJldHVybiB0cmFuc2xhdGlvbnNba2V5XSB8fCBrZXk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFJlbGF0aXZlIFVSTCBoZWxwZXJcclxuICAgIHJlbGF0aXZlVVJMOiAoZGVwdGg6IG51bWJlciB8IHN0cmluZywgLi4uYXJnczogc3RyaW5nW10pID0+IHtcclxuICAgICAgICBjb25zdCBiYXNlVXJsID0gdHlwZW9mIGRlcHRoID09PSAnbnVtYmVyJyA/ICcuLi8nLnJlcGVhdChkZXB0aCkgOiBkZXB0aDtcclxuICAgICAgICByZXR1cm4gYmFzZVVybCArIGFyZ3Muam9pbignLycpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvLyBUZW1wbGF0ZSBoZWxwZXJzXHJcbiAgICBjb21wYXJlOiAoYTogYW55LCBvcGVyYXRvcjogc3RyaW5nLCBiOiBhbnkpID0+IHtcclxuICAgICAgICBzd2l0Y2ggKG9wZXJhdG9yKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJz09PSc6IHJldHVybiBhID09PSBiO1xyXG4gICAgICAgICAgICBjYXNlICchPT0nOiByZXR1cm4gYSAhPT0gYjtcclxuICAgICAgICAgICAgY2FzZSAnPT0nOiByZXR1cm4gYSA9PSBiO1xyXG4gICAgICAgICAgICBjYXNlICchPSc6IHJldHVybiBhICE9IGI7XHJcbiAgICAgICAgICAgIGNhc2UgJzwnOiByZXR1cm4gYSA8IGI7XHJcbiAgICAgICAgICAgIGNhc2UgJz4nOiByZXR1cm4gYSA+IGI7XHJcbiAgICAgICAgICAgIGNhc2UgJzw9JzogcmV0dXJuIGEgPD0gYjtcclxuICAgICAgICAgICAgY2FzZSAnPj0nOiByZXR1cm4gYSA+PSBiO1xyXG4gICAgICAgICAgICBkZWZhdWx0OiByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvLyBDaGVjayBpZiB0YWIgaXMgZW5hYmxlZFxyXG4gICAgaXNUYWJFbmFibGVkOiAobmF2VGFiczogYW55W10sIHRhYklkOiBzdHJpbmcpID0+IHtcclxuICAgICAgICByZXR1cm4gbmF2VGFicy5zb21lKHRhYiA9PiB0YWIuaWQgPT09IHRhYklkKTtcclxuICAgIH0sXHJcblxyXG4gICAgLy8gQ2hlY2sgaWYgdGFiIGlzIGluaXRpYWwvYWN0aXZlXHJcbiAgICBpc0luaXRpYWxUYWI6IChuYXZUYWJzOiBhbnlbXSwgdGFiSWQ6IHN0cmluZykgPT4ge1xyXG4gICAgICAgIHJldHVybiBuYXZUYWJzLmxlbmd0aCA+IDAgJiYgbmF2VGFic1swXS5pZCA9PT0gdGFiSWQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8vIERlcHRoIGZvciByZWxhdGl2ZSBVUkxzXHJcbiAgICBkZXB0aDogMCxcclxuXHJcbiAgICAvLyBHbG9iYWwgZmxhZ3NcclxuICAgIGRpc2FibGVTZWFyY2g6IGZhbHNlLFxyXG4gICAgZGlzYWJsZUdyYXBoOiBmYWxzZSxcclxuICAgIGRpc2FibGVDb3ZlcmFnZTogZmFsc2UsXHJcbiAgICBkaXNhYmxlTGlmZUN5Y2xlSG9va3M6IGZhbHNlLFxyXG4gICAgZGlzYWJsZVByb3BlcnRpZXM6IGZhbHNlLFxyXG4gICAgZGlzYWJsZURvbVRyZWU6IGZhbHNlLFxyXG4gICAgZGlzYWJsZVRlbXBsYXRlVGFiOiBmYWxzZSxcclxuICAgIGRpc2FibGVTdHlsZVRhYjogZmFsc2UsXHJcbiAgICBkaXNhYmxlUHJpdmF0ZTogZmFsc2UsXHJcbiAgICBkaXNhYmxlUHJvdGVjdGVkOiBmYWxzZSxcclxuICAgIGRpc2FibGVJbnRlcm5hbDogZmFsc2VcclxufTtcclxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7OztBQUdHO0FBbUJJLElBQU0sWUFBWSxHQUFnQjtBQUNyQyxJQUFBLFNBQVMsRUFBRTtBQUNQLFFBQUEsSUFBSSxFQUFFLHNCQUFzQjtBQUM1QixRQUFBLElBQUksRUFBRSw4Q0FBOEM7QUFDcEQsUUFBQSxVQUFVLEVBQUUsS0FBSztBQUNqQixRQUFBLFFBQVEsRUFBRSxrQkFBa0I7QUFDNUIsUUFBQSxXQUFXLEVBQUUsK0JBQStCO1FBQzVDLFNBQVMsRUFBRSxDQUFDLCtCQUErQixDQUFDO0FBQzVDLFFBQUEsV0FBVyxFQUFFLCtEQUErRDtBQUM1RSxRQUFBLE1BQU0sRUFBRTtBQUNKLFlBQUE7QUFDSSxnQkFBQSxJQUFJLEVBQUUsTUFBTTtBQUNaLGdCQUFBLElBQUksRUFBRSxNQUFNO0FBQ1osZ0JBQUEsV0FBVyxFQUFFLDRCQUE0QjtBQUN6QyxnQkFBQSxJQUFJLEVBQUUsRUFBRTtBQUNSLGdCQUFBLFlBQVksRUFBRTtBQUNqQixhQUFBO0FBQ0QsWUFBQTtBQUNJLGdCQUFBLElBQUksRUFBRSxVQUFVO0FBQ2hCLGdCQUFBLElBQUksRUFBRSxTQUFTO0FBQ2YsZ0JBQUEsV0FBVyxFQUFFLG1DQUFtQztBQUNoRCxnQkFBQSxJQUFJLEVBQUUsRUFBRTtBQUNSLGdCQUFBLFlBQVksRUFBRTtBQUNqQjtBQUNKLFNBQUE7QUFDRCxR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
