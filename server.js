/**
 * Created by lykovartem on 2/27/2017.
 */

// set up ========================
let express = require('express');
let app = express();
let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let morgan = require('morgan');                     // log requests to the console (express4)
let bodyParser = require('body-parser');            // pull information from HTML POST (express4)
let methodOverride = require('method-override');    // simulate DELETE and PUT (express4)

let bcrypt = require('bcrypt');
const SALT_WORK_FACTOR = 10;

// configuration =================
const PORT = 8080;

mongoose.connect('mongodb://admin:admin@ds163699.mlab.com:63699/wunderlist');     // connect to mongoDB database

app.use(express.static(__dirname + '/'));
app.use(morgan('dev'));                                         // log every request to the console
app.use(bodyParser.urlencoded({'extended': 'true'}));           // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(methodOverride());

// define model ==================

let TaskSchema = new Schema({
    name: String,
    description: String,
    hours: Number,
    taskState: String,
    id: Number,
    createTime: Date,
    // _creator: {type: Schema.Types.ObjectId, ref: 'UserModel'}
});

let TaskModel = mongoose.model('TaskModel', TaskSchema);

let UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        index: {unique: true}
    },
    password: {
        type: String,
        required: true
    },
    // tasks: [{type: Schema.Types.ObjectId, ref: 'TaskModel'}]
    tasks: [TaskSchema]
});

UserSchema.pre('save', function (next) {

    // only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();

    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, (err, salt) => {
        if (err) return next(err);

        // hash the password along with our new salt
        bcrypt.hash(this.password, salt, (err, hash) => {
            if (err) return next(err);

            // override the cleartext password with the hashed one
            this.password = hash;
            next();
        });
    });
});

UserSchema.methods.comparePassword = function (candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

let UserModel = mongoose.model('UserModel', UserSchema);

// routes ========================
app.post('/api/log-in', function (req, res) {
    let username = req.body.username;
    let password = req.body.password;

    UserModel.findOne({username}, function (err, user) {
        if (err) throw err;

        user.comparePassword(password, function (err, isMatch) {
            if (err) throw err;
            if (isMatch) {
                res.send(user._id);
                app.currentUser = user._id;
            }
        });
    });
});

app.post('/api/register', function (req, res) {
    let username = req.body.username;
    let password = req.body.password;

    let newUser = new UserModel({username, password});

    newUser.save(function (err) {
        if (err) throw err;
        res.sendStatus(200);
    });
});

app.get('/api/all-tasks', function (req, res) {
    UserModel.findOne({_id: app.currentUser}, function (err, user) {
        if (err) return handleError(err);
        res.json(user.tasks);
    });
});

app.post('/api/create-task', function (req, res) {
    let data = req.body;
    let newTask = new TaskModel(data);
    UserModel
        .findOne({_id: app.currentUser})
        .tasks.push(data);
    newTask.save(function (err) {
        if (err) return handleError(err);
    });
});

app.put('/api/update-task/:_id', function (req, res) {
    let data = req.body;
    TaskModel.update({_id: req.params._id}, {
        name: data.name,
        description: data.description,
        hours: data.hours,
        taskState: data.taskState
    }, function (err) {
        if (err) return handleError(err);
    })
});

app.delete('/api/delete-task/:_id', function (req, res) {
    TaskModel.remove({_id: req.params._id},
        function (err) {
            if (err) return handleError(err);
        });
});

app.listen(PORT);
console.log(`App listening on port ${PORT}`);
