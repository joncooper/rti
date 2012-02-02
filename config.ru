root=Dir.pwd
puts ">>> Serving: #{root}"

use Rack::ContentLength
use Rack::Static, :urls => ['/js', '/rti', '/docs', '/assets']

map '/' do
  run Rack::File.new("#{root}/index.html")
end
