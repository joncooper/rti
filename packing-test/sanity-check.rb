File.open('sample.dat') do |f|
  f.read.unpack('ffff').each do |as_float|
    puts as_float
  end
end
