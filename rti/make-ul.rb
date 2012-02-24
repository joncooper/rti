puts <<EOT
<ul class="nav">
<li class="dropdown">
<a href="#" class="dropdown-toggle" data-toggle="dropdown">Files<b class="caret"></b></a>
<ul class="dropdown-menu rti-file-list">
EOT

Dir['*.ptm'].each do |fn|
  _, name, type = fn.match(/(.*)\.(.*)$/).to_a
#  next if type == 'ptm'
  puts "<li><a href=\"rti/#{fn}\" data-filetype=\"#{type}\">#{name}</a></li>"
end
puts "</ul>" # .dropdown-menu
puts "</li>" # .dropdown
puts "</ul>" # .nav
