var VoteBox = React.createClass({
  onItemClick: function(e) {
    var node = $(e.target);
    if (POKER.story_id) {
      // Remove all selected points
      $('.vote-list ul li input').removeClass('btn-info');
      node.toggleClass('btn-info');
      App.rooms.perform('vote', {
        roomId: POKER.roomId,
        data: { points: node.val(), story_id: POKER.story_id },
      });
    }
  },
  disableVote: function() {
    $('.vote-list ul li input').addClass('disabled');
  },
  componentDidMount: function() {
    EventEmitter.subscribe("storySwitched", function(){
      $('.vote-list ul li input').removeClass('btn-info');
    });
    EventEmitter.subscribe("noStoriesLeft", this.disableVote);
  },
  render:function() {
    var currentVote = this.props.poker.currentVote;
    var that = this;
    var pointsList = this.props.poker.pointValues.map(function(point) {
      var currentVoteClassName = currentVote == point ? ' btn-info' : '';
      return (
        <li key={point}>
          <input className={'btn btn-default btn-lg' + currentVoteClassName } type="button" onClick={that.onItemClick} value={point} />
        </li>
      )
    });

    return (
      <div className="panel panel-default">
        <div className="panel-heading">Deck</div>
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