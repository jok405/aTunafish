
const cheerio = require("cheerio");
const request = require("request");

const Note = require("../models/Note.js");
const Article = require("../models/Article.js");
const Save = require("../models/Save.js");

module.exports = function (app) {
    app.get("/scrape", function (req, res) {
        request("https://www.diynetwork.com/", function (error, response, html) {
            //console.log("diy");

            var $ = cheerio.load(html);
            //console.log("diy");

            $(".m-MediaBlock__m-MediaWrap").each(function (i, element) {
                var result = {};
                console.log("diy");

                //result.summary = $(element).children("p.summary").text();
                // console.log("diy");
                // result.byline = $(element).children("p.byline").text();
                // result.title = $(element).children("img").text();
                result.link = $(element).children("a").attr("href"); // h2 => img => div
                result.imageSrc = $(element).children("a").children("img").attr("src");
                console.log(result);
                if (result.title && result.link) {
                    var entry = new Article(result);

                    Article.update(
                        { link: result.link },
                        result,
                        { upsert: true },
                        function (error, doc) {
                            if (error) {
                                console.log(error);
                            }   
                        }
                    );
                }
            });
            res.json({ "code": "success" });

        });
    });

    app.get("/articles", function (req, res) {
        Article.find({}, function (error, doc) {
            if (error) {
                console.log(error);
            } else {
                res.send(doc);
            }
        });
    });

    app.get("/articles/:id", function (req, res) {
        Article.find({
            "_id": req.params.id
        })
            .populate("note")
            .exec(function (error, doc) {
                if (error) {
                    console.log(error)
                } else {
                    res.send(doc);
                }
            });
    });

    app.get("/saved/all", function (req, res) {
        Save.find({})
            .populate("note")
            .exec(function (error, data) {
                if (error) {
                    console.log(error);
                    res.json({ "code": "error" });
                } else {
                    res.json(data);
                }
            });
    });

    app.post("/save", function (req, res) {
        var result = {};
        result.id = req.body._id;
        result.summary = req.body.summary;
        result.byline = req.body.byline;
        result.title = req.body.title;
        result.link = req.body.link;
        var entry = new Save(result);
        entry.save(function (err, doc) {

            if (err) {
                console.log(err);
                res.json(err);
            }
            else {
                res.json(doc);
            }
        });
    });

    app.delete("/delete", function (req, res) {
        var result = {};
        result._id = req.body._id;
        Save.findOneAndRemove({
            '_id': req.body._id
        }, function (err, doc) {
            if (err) {
                console.log("error:", err);
                res.json(err);
            }
            else {
                res.json(doc);
            }
        });
    });

    app.get("/notes/:id", function (req, res) {
        if (req.params.id) {
            Note.find({
                "article_id": req.params.id
            })
                .exec(function (error, doc) {
                    if (error) {
                        console.log(error)
                    } else {
                        res.send(doc);
                    }
                });
        }
    });

    app.post("/notes", function (req, res) {
        if (req.body) {
            var newNote = new Note(req.body);
            newNote.save(function (error, doc) {
                if (error) {
                    console.log(error);
                } else {
                    res.json(doc);
                }
            });
        } else {
            res.send("Error");
        }
    });

    app.get("/notepopulate", function (req, res) {
        Note.find({
            "_id": req.params.id
        }, function (error, doc) {
            if (error) {
                console.log(error);
            } else {
                res.send(doc);
            }
        });
    });

    app.delete("/deletenote", function (req, res) {
        var result = {};
        result._id = req.body._id;
        Note.findOneAndRemove({
            '_id': req.body._id
        }, function (err, doc) {
            if (err) {
                console.log("error:", err);
                res.json(err);
            }
            else {
                res.json(doc);
            }
        });
    });
}