var EventEmitter = {
  _events: {},
  dispatch: function (event, data) {
      if (!this._events[event]) { // 没有监听事件
        return;
      }
      for (var i = 0; i < this._events[event].length; i++) {
          this._events[event][i](data);
      }
  },
  subscribe: function (event, callback) {
    // 创建一个新事件数组
    if (!this._events[event]) {
      this._events[event] = [];
    }
    this._events[event].push(callback);
  }
};

function publishResult() {
  client.publish(channelName, {
    data: 'open',
    type: 'action'
  });
}

var StatusBar = React.createClass({
  render:function(){
    return (
      <h3>
        {this.props.name}
        <i className="pull-right">Yo, {this.props.poker.currentUser.name}({this.props.poker.currentUser.role})!</i>
      </h3>
    );
  }
});

var VoteBox = React.createClass({
  onItemClick: function(e) {
    var node = $(e.target);

    $.ajax({
      url: '/rooms/' + POKER.room_id + '/vote',
      data: { points: node.val(), story_id: POKER.story_id },
      method: 'post',
      dataType: 'json',
      cache: false,
      success: function(data) {
        // Remove all selected points
        $('.vote-list ul li input').removeClass('btn-info');
        node.toggleClass('btn-info');
        if (true) {
          publishResult();
        }
      },
      error: function(xhr, status, err) {
        console.error(status, err.toString());
      }
    });
  },
  render:function() {
    var currentVote = this.props.poker.currentVote;
    var that = this;
    var pointsList = this.props.poker.pointsRange.map(function(point) {
      var currentVoteClassName = currentVote == point ? ' btn-info' : '';
      return (
        <li key={point}>
          <input className={'btn btn-default btn-lg' + currentVoteClassName } type="button" onClick={that.onItemClick} value={point} />
        </li>
      )
    });

    return (
      <div className="panel panel-default">
        <div className="panel-heading">Vote</div>
        <div className="vote-list panel-body row">
          <div className="col-md-12">
            <ul className="list-inline">
              {pointsList}
            </ul>
          </div>
        </div>
      </div>
    );
  }
});

var StoryListBox = React.createClass({
  loadStoryListFromServer: function(callback) {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data: data});
        callback();
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  getInitialState: function() {
    return {data: []};
  },
  componentDidMount: function() {
    this.loadStoryListFromServer(function(){
      setupChannelSubscription();
    });
  },
  componentDidUpdate: function() {
    POKER.story_id = (function() {
      return $('.storyList ul li:first').data('id')
    })();
    Cookies.set('story_id', POKER.story_id);
  },
  render: function() {
    return (
      <div className="panel panel-default">
        <div className="panel-heading">Stories</div>
        <div id="storyListArea" className="panel-body row">
          <div className="storyListBox">
            <StoryList data={this.state.data} />
          </div>
        </div>
      </div>
    );
  }
});

var StoryList = React.createClass({
  render: function() {
    var storyNodes = this.props.data.map(function(story) {
      return (
        <Story key={story.id} id={story.id} link={story.link} desc={story.desc} />
      );
    });
    return (
      <div className="storyList col-md-12">
        <ul>
          {storyNodes}
        </ul>
      </div>
    );
  }
});

var Story = React.createClass({
  // rawMarkup: function() {
  //   var rawMarkup = marked(this.props.children.toString(), {sanitize: true});
  //   return { __html: rawMarkup };
  // },

  render: function() {
    return (
      <li className="story" id={'story-' + this.props.id} data-id={this.props.id}>
        <a href={this.props.link} className="storyLink">
          {this.props.link}
        </a>
        <p className="story-desc">
          {this.props.desc}
        </p>
      </li>
    );
  }
});

var PeopleListBox = React.createClass({
  loadPeopleListFromServer: function(callback) {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data: data});
        callback();
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  getInitialState: function() {
    return {data: []};
  },
  componentDidMount: function() {
    this.loadPeopleListFromServer(function(){
      EventEmitter.dispatch("peopleListLoaded")
    });
    // setInterval(this.loadPeopleListFromServer, this.props.pollInterval);
  },
  render: function() {
    return (
      <div className="panel panel-default">
        <div className="panel-heading">People</div>
        <div id="peopleListArea" className="panel-body row">
          <div className="peopleListBox">
            <PeopleList data={this.state.data} />
          </div>
        </div>
      </div>
    );
  }
});

var PeopleList = React.createClass({
  render: function() {
    var peopleNodes = this.props.data.map(function(person) {
      return (
        <Person key={person.id} name={person.name} id={person.id} role={person.display_role.toLowerCase()} points={person.points} />
      );
    });
    return (
      <div className="people-list col-md-12">
        <ul className="list-unstyled">
          {peopleNodes}
        </ul>
      </div>
    );
  }
});

var Person = React.createClass({
  render: function() {
    var userIconClass;
    if (this.props.role === 'watcher') {
      userIconClass = 'fa fa-user fa-user-secret';
    } else {
      userIconClass = 'fa fa-user';
    }

    return (
      <li className="person" id={'u-' + this.props.id} data-point={this.props.points}>
        <i className={this.props.role + ' ' + userIconClass} aria-hidden="true"></i>
        <a href="javascript:;" className="person">
          {this.props.name}
          <span className="points label label-success pull-right">{this.props.points}</span>
        </a>
      </li>
    );
  }
});

var ActionBox = React.createClass({
  getInitialState: function() {
    return { openYet: false };
  },
  handleClick: function(e) {
    window.syncResult = true;
    this.setState({openYet: !this.state.openYet});
    $(this.refs.openButton).hide();
  },
  render: function() {
    return (
      <div className="panel panel-default">
        <div className="panel-heading">Action</div>
        <div className="panel-body row">
          <div id="actionBox" className="row">
            <div ref="openButton" className="openButton">
              <div className="col-sm-3"></div>
              <div className="col-sm-4">
                <a onClick={this.handleClick} className="btn btn-default btn-lg btn-success" href="javascript:;" role="button">
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;开？&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                </a>
              </div>
              <div className="col-sm-4"></div>
            </div>

            <ResultPanel open={this.state.openYet}/>
          </div>
        </div>
      </div>
    );
  }
});

var ResultPanel = React.createClass({
  readFromElement: function() {
    var pointHash = {};
    $('.people-list ul li').each(function(i, ele) {
      var point = $(ele).attr('data-point')
      if (point) {
        var pointCount = pointHash[point] || 0;
        pointHash[point] = (pointCount += 1);
      }
    });

    var maxPointCount = 0;
    $.each(pointHash, function(k, v){
      if (v > maxPointCount) {
        maxPointCount = v;
      }
    });

    keys = Object.keys(pointHash),
    len = keys.length;

    keys.sort();

    var pointArray = [];
    for (i = len; i >= 0; i--) {
      point = keys[i];
      count = pointHash[point];
      barWidth = count/maxPointCount * 100;
      pointArray.push({point: point, count: count, barWidth: barWidth})
    }
    this.setState({data: pointArray});
  },
  getInitialState: function() {
    return {data: []};
  },
  componentDidMount: function() {
    EventEmitter.subscribe("peopleListLoaded", this.readFromElement)
  },
  render: function() {
    var pointBars = this.state.data.map(function(pointBar) {
      return (
        <PointBar key={pointBar.point+ '-' +pointBar.count} point={pointBar.point} count={pointBar.count} barWidth={pointBar.barWidth} />
      );
    });

    var that = this;
    var resultChart = (function() {
      if (that.props.open) {
        return (
          <ul className="list-unstyled">
            {pointBars}
          </ul>
        );
      } else {
        return (<div></div>);
      }
    })();

    return (
      <div className="container-fluid" style={{clear: 'both', width: '100%'}}>
        <div className="row-container container-fluid">
          {resultChart}
        </div>
      </div>
    );
  }
});

var PointBar = React.createClass({
  selectPoint: function() {
    $.ajax({
      url: '/rooms/' + POKER.room_id + '/set_story_point',
      data: { point: this.props.point, story_id: POKER.story_id },
      method: 'post',
      dataType: 'json',
      cache: false,
      success: function(data) {
        alert('success');
      },
      error: function(xhr, status, err) {
        console.error(status, err.toString());
      }
    });
  },
  render: function() {
    return (
      <li className="row" data-point={this.props.point}>
        <div className="row-container">
          <div className="col-md-1 point">{this.props.point}</div>
          <div className="col-md-10 bar">
            <div onClick={this.selectPoint} style={{width: this.props.barWidth + '%', background: 'gray', color: '#fff', 'textAlign': 'center'}}>
              {this.props.count}
            </div>
          </div>
        </div>
      </li>
    );
  }
});

var Room = React.createClass({
  rawMarkup: function() {
    var rawMarkup = marked(this.props.children.toString(), {sanitize: true});
    return { __html: rawMarkup };
  },
  getInitialState: function() {
    return { storyListUrl: this.props.poker.storyListUrl, peopleListUrl: this.props.poker.peopleListUrl };
  },
  render: function() {
    return (
      <div>
        <div className="col-md-12 name">
          <StatusBar poker={POKER}/>
        </div>
        <div id="operationArea" className="col-md-8">
          <VoteBox poker={POKER}/>
          <StoryListBox url={this.props.poker.storyListUrl} />
        </div>

        <div className="col-md-4">
          <PeopleListBox url={this.props.poker.peopleListUrl} />
          <ActionBox />
        </div>
      </div>
    );
  }
});

function setupChannelSubscription() {
  // Subscribe to the public channel
  window.channelName = ['/rooms', POKER.room_id, POKER.story_id].join('/')
  var public_subscription = client.subscribe(channelName, function(data) {
    console.log(data);
    if (data.type === 'action') {
      window.syncResult = true;
      $('#show-result').show();
    } else {
      $('#u-' + data.person_id + ' .points').text(data.points);
      $('#u-' + data.person_id).attr('data-point', data.points);
    }
  });
}

$(document).on("page:change", function() {
  var storyListUrl = "/rooms/"+POKER.room_id+"/story_list.json";
  var peopleListUrl = "/rooms/"+POKER.room_id+"/user_list.json";

  POKER.storyListUrl = "/rooms/"+POKER.room_id+"/story_list.json";
  POKER.peopleListUrl = "/rooms/"+POKER.room_id+"/user_list.json";
  POKER.pointsRange = [0, 2, 3, 5, 8, 13, 20, 40, 100, 'coffee'];
  POKER.story_id = (function() {
    return $('.storyList ul li:first').data('id')
  })();

  // Initialize sync result as false
  window.syncResult = false;

  window.client = new Faye.Client('http://localhost:9292/faye');

  ReactDOM.render(
    <Room poker={POKER} />,
    document.getElementById('room')
  );

  // $('.vote-list ul li input').on('click', function(e){
  //   var node = $(this);

  //   $.ajax({
  //     url: '/rooms/' + POKER.room_id + '/vote',
  //     data: { points: node.val(), story_id: POKER.story_id },
  //     method: 'post',
  //     dataType: 'json',
  //     cache: false,
  //     success: function(data) {
  //       // Remove all selected points
  //       $('.vote-list ul li input').removeClass('btn-info');
  //       node.toggleClass('btn-info');
  //       if (syncResult) {
  //         publishResult();
  //       }
  //     },
  //     error: function(xhr, status, err) {
  //       console.error(status, err.toString());
  //     }
  //   });
  // })

  POKER.nextStory = function() {
    $('#story-' + POKER.story_id).fadeOut();
    this.dispatch('storyListUpdated', { name: 'John' });
  }

});
