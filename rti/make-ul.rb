puts "<ul>"
Dir['*.rti'].each do |fn|
  _, name, type = fn.match(/(.*)\.(.*)$/).to_a
  next if type == 'ptm'
  puts "  <li><a href=\"rti/#{fn}\" data-filetype=\"#{type}\">#{name}</a></li>"
end
puts "</ul>"
