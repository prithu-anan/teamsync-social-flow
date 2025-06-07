              {channel.type === 'channel' && (
                <div className="flex flex-col">
                  <span className="text-sm font-medium">#{channel.name}</span>
                  {channel.lastMessage && (
                    <span className="text-xs text-muted-foreground truncate">
                      {channel.lastMessageUserName && (
                        <span className="font-medium">{channel.lastMessageUserName}: </span>
                      )}
                      {channel.lastMessage}
                    </span>
                  )}
                </div>
              )} 