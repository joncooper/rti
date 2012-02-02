use Rack::ContentLength
use Rack::Static, :urls => ['/js', '/rti', '/docs', '/assets']

run ->env {
  [
    200,
    {
      'Content-Type' => 'text/html'
    },
    File.open('index.html', File::RDONLY)
  ]
}
