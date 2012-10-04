$(function(){

	String.prototype.linkify = function() {
		return this.replace(/[A-Za-z]+:\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9-_:%&\?\/.=]+/, function(m) {
			return m.link(m);
		});
	};

	function relative_time(time_value) {
		var values = time_value.split(" ");
		// time_value = values[2] + " " + values[1] + ", " + values[3] + " " + values[5];
		var parsed_date = Date.parse(time_value);
		var relative_to = (arguments.length > 1) ? arguments[1] : new Date();
		var delta = parseInt((relative_to.getTime() - parsed_date) / 1000);
		delta = delta + (relative_to.getTimezoneOffset() * 60);

		var r = '';
		if (delta < 60) {
			r = 'a minute ago';
		} else if(delta < 120) {
			r = 'couple of minutes ago';
		} else if(delta < (45*60)) {
			r = (parseInt(delta / 60)).toString() + ' minutes ago';
		} else if(delta < (90*60)) {
			r = 'an hour ago';
		} else if(delta < (24*60*60)) {
			r = '' + (parseInt(delta / 3600)).toString() + ' hours ago';
		} else if(delta < (48*60*60)) {
			r = '1 day ago';
		} else {
			r = (parseInt(delta / 86400)).toString() + ' days ago';
		}

		return r;
	}


	var TweetModel = Backbone.Model.extend({
		initialize: function() {
			var txt = this.get('text');
			this.set('text', txt.linkify());
			this.set('relative_time', relative_time(this.get('created_at')));
		}
	});

	var TweetCollection = Backbone.Collection.extend({
        model: TweetModel,
        initialize: function() {

        },
        url: function() {
			return 'http://search.twitter.com/search.json?q=' + this.query +  '&page=' + this.page + '&callback=?';
        },
        query: '', //default query
        page: '1',
        parse: function(resp, xhr) {
			return resp.results;
        }

    });

	var TweetController = Backbone.View.extend({
		tagName: 'li',
		events: {
			"click .tweet-reply": "onReply",
			"click .tweet-retweet": "onRetweet",
			"click .tweet-favorite": "onFavorite"
		},
		initialize: function() {
			this.render();
		},
		render: function() {
			this.template = _.template($('#tweet-view-new').html());
            var dict = this.model.toJSON();
            var markup = this.template(dict);
            $(this.el).html(markup);
            return this;
		},
		onReply: function() {
			var url = "https://twitter.com/intent/tweet?in_reply_to=" + this.model.get('id');
			window.open(url, "_newtab");
		},
		onRetweet: function() {
			var url = "https://twitter.com/intent/retweet?tweet_id=" + this.model.get('id');
			window.open(url, "_newtab");
		},
		onFavorite: function() {
			var url = "https://twitter.com/intent/favorite?tweet_id=" + this.model.get('id');
			window.open(url, "_newtab");
		}

	});

	var AppController = Backbone.View.extend({
		events: {
			'submit .tweet-search': 'onSearch'
		},
		initialize: function () {
			this._tweetsView = [];
			this.tweets = new TweetCollection();

			//set event handlers
			_.bindAll(this, 'onTweetAdd');
			this.tweets.bind('add', this.onTweetAdd);
		},

		loadTweets: function () {
			var that = this;
			this.tweets.query = this.$('.search-query').val();
			this.tweets.fetch({
				add: that.onTweetAdd,
				success: function() {
					$('.title').html('<span class="blue">' + that.tweets.length + '</span> results for: "' + that.tweets.query +'"');
				}
			});
		},

		onSearchh: function() {
			alert('bug ako');
		},

		onSearch: function() {
			this.tweets.query = this.$('.search-query').val();
			this.tweets.reset();
			this.$('.tweets-result li').remove();
			this.loadTweets();
			return false;
		},

		onTweetAdd: function(model) {
			console.log('tweet added', model.get('text'));
			var tweetController = new TweetController({
				model: model
			});

			//display tweet item
			this._tweetsView.push(tweetController);
			this.$('.tweets-result').append(tweetController.render().el);
		}

	});

	window.app = new AppController({
		el: $('body')
	});

});