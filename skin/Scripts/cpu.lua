-- CPU widget: big percentage + 18-bar history (one bar per second, like the design).
local PT, num, mCPU, barDir
local hist, shown = {}, {}

function Initialize()
  local res = SKIN:GetVariable('@')
  PT = dofile(res .. 'Scripts\\pixeltext.lua')
  num = PT.new{ prefix = 'MeterNum', slots = 4, cell = tonumber(SKIN:GetVariable('Cell')),
                glyphs = dofile(res .. 'Scripts\\glyphs_cpu.lua'), dir = res .. 'Images\\CPU\\big\\' }
  barDir = res .. 'Images\\CPU\\bar\\'
  mCPU = SKIN:GetMeasure('MeasureCPU')
  for i = 1, 18 do hist[i] = 0 end
end

function Update()
  local v = math.max(0, math.min(100, mCPU:GetValue()))
  table.remove(hist, 1)
  hist[18] = v
  num:draw(tostring(PT.round(v)) .. '%', 1)
  for i = 1, 18 do
    local h = math.max(1, PT.round(hist[i] / 100 * 18))
    if shown[i] ~= h then
      SKIN:Bang('!SetOption', 'MeterBar' .. i, 'ImageName', barDir .. (i - 1) .. '_' .. h .. '.png')
      shown[i] = h
    end
  end
  return v
end
