module ApplicationCable
  class Connection < ActionCable::Connection::Base
    # uniquely identify this connection
    identified_by :current_user

    # called when the client first connects
    def connect
      self.current_user = find_verified_user
    end

    protected

    def find_verified_user
      if current_user = User.find(cookies.signed[:user_id])
        current_user
      else
        reject_unauthorized_connection
      end
    end
  end
end