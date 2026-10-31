-- Memory widget: used GB + 12-segment bar of used / total.
local PT, num, unit, mUsed, mTotal, segDir, cell
local shownOn = -1

function Initialize()
  local res = SKIN:GetVariable('@')
  PT = dofile(res .. 'Scripts\\pixeltext.lua')
  cell = tonumber(SKIN:GetVariable('Cell'))
  num = PT.new{ prefix = 'MeterNum', slots = 5, cell = cell,
                glyphs = dofile(res .. 'Scripts\\glyphs_mem.lua'), dir = res .. 'Images\\Memory\\big\\' }
  unit = PT.new{ prefix = 'MeterUnit', slots = 2, cell = cell,
                 glyphs = dofile(res .. 'Scripts\\glyphs_mem_unit.lua'), dir = res .. 'Images\\Memory\\unit\\' }
  segDir = res .. 'Images\\Memory\\seg\\'
  mUsed = SKIN:GetMeasure('MeasureMemUsed')
  mTotal = SKIN:GetMeasure('MeasureMemTotal')
end

function Update()
  local used, total = mUsed:GetValue(), mTotal:GetValue()
  local gb = used / 1073741824
  local w = num:draw(string.format('%.1f', gb), 1)
  unit.last = nil                      -- "GB" moves with the number's width
  unit:draw('GB', w + 5)
  local on = 0
  if total > 0 then on = PT.round(math.max(0, math.min(1, used / total)) * 12) end
  if on ~= shownOn then
    for i = 1, 12 do
      SKIN:Bang('!SetOption', 'MeterSeg' .. i, 'ImageName', segDir .. (i - 1) .. '_' .. (i <= on and 1 or 0) .. '.png')
    end
    shownOn = on
  end
  return gb
end
