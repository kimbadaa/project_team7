import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { Bell, Plus, Trash2, Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Calendar } from './ui/calendar';

interface Reminder {
  id: string;
  supplement: string;
  time: string;
  days: string[];
  createdAt: string;
}

const DAYS_OF_WEEK = [
  { value: '월', label: '월' },
  { value: '화', label: '화' },
  { value: '수', label: '수' },
  { value: '목', label: '목' },
  { value: '금', label: '금' },
  { value: '토', label: '토' },
  { value: '일', label: '일' },
];

export function ReminderManager({ accessToken }: { accessToken: string }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [newReminder, setNewReminder] = useState({
    supplement: '',
    time: '09:00',
    days: ['월', '화', '수', '목', '금', '토', '일'],
  });

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4ff4137c/reminders`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setReminders(data.reminders || []);
      } else {
        console.error('Failed to fetch reminders:', data.error);
      }
    } catch (err) {
      console.error('Fetch reminders exception:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newReminder.supplement.trim() || newReminder.days.length === 0) {
      alert('영양제 이름과 요일을 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4ff4137c/reminders`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(newReminder),
        }
      );

      const data = await response.json();

      if (response.ok) {
        await fetchReminders();
        setNewReminder({
          supplement: '',
          time: '09:00',
          days: ['월', '화', '수', '목', '금', '토', '일'],
        });
        setShowAddForm(false);
      } else {
        console.error('Failed to add reminder:', data.error);
        alert('알림 추가에 실패했습니다.');
      }
    } catch (err) {
      console.error('Add reminder exception:', err);
      alert('알림 추가 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    if (!confirm('이 알림을 삭제하시겠습니까?')) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4ff4137c/reminders/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        await fetchReminders();
      } else {
        console.error('Failed to delete reminder');
        alert('알림 삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('Delete reminder exception:', err);
      alert('알림 삭제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: string) => {
    if (newReminder.days.includes(day)) {
      setNewReminder({
        ...newReminder,
        days: newReminder.days.filter(d => d !== day),
      });
    } else {
      setNewReminder({
        ...newReminder,
        days: [...newReminder.days, day],
      });
    }
  };

  // 특정 날짜에 알림이 있는지 확인
  const hasReminderOnDate = (date: Date) => {
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    return reminders.some(reminder => reminder.days.includes(dayOfWeek));
  };

  // 선택된 날짜의 알림 필터링
  const getRemindersForDate = (date: Date) => {
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    return reminders.filter(reminder => reminder.days.includes(dayOfWeek));
  };

  const selectedDateReminders = selectedDate ? getRemindersForDate(selectedDate) : [];

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Bell className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-gray-900">복용 알림 관리</h2>
            <p className="text-gray-600">영양제 복용 시간을 알림으로 받아보세요</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              리스트
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-md transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              달력
            </button>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all shadow-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>알림 추가</span>
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-6 bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-200">
          <h3 className="text-gray-900 mb-4">새 알림 추가</h3>
          <form onSubmit={handleAddReminder} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">영양제 이름</label>
              <input
                type="text"
                value={newReminder.supplement}
                onChange={(e) => setNewReminder({ ...newReminder, supplement: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="예: 비타민D"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">복용 시간</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="time"
                  value={newReminder.time}
                  onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">반복 요일</label>
              <div className="flex gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`flex-1 py-3 rounded-xl transition-all shadow-sm ${
                      newReminder.days.includes(day.value)
                        ? 'bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg scale-105'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all shadow-lg disabled:opacity-50"
              >
                {loading ? '추가 중...' : '알림 추가'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Info Notice */}
      <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-4 shadow-sm">
        <div className="flex gap-3">
          <span className="text-2xl">📱</span>
          <div>
            <h4 className="text-yellow-900 mb-1">알림 안내</h4>
            <p className="text-yellow-700 text-sm">
              설정된 시간과 요일을 확인하여 복용 시간을 놓치지 마세요!
            </p>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' ? (
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-purple-500" />
                알림 달력
              </h3>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-xl border-2 border-purple-100"
                modifiers={{
                  hasReminder: (date) => hasReminderOnDate(date)
                }}
                modifiersStyles={{
                  hasReminder: {
                    backgroundColor: '#f3e8ff',
                    fontWeight: 'bold',
                    color: '#9333ea'
                  }
                }}
              />
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 rounded bg-purple-200"></div>
                <span>알림이 설정된 날짜</span>
              </div>
            </div>

            <div>
              <h3 className="text-gray-900 mb-4">
                {selectedDate ? `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 (${['일', '월', '화', '수', '목', '금', '토'][selectedDate.getDay()]})` : '날짜를 선택하세요'}
              </h3>
              {selectedDate && (
                <div className="space-y-3">
                  {selectedDateReminders.length > 0 ? (
                    selectedDateReminders.map((reminder) => (
                      <div
                        key={reminder.id}
                        className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
                            <span className="text-2xl">💊</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-gray-900">{reminder.supplement}</h4>
                            <div className="flex items-center gap-1 text-sm text-purple-700">
                              <Clock className="w-4 h-4" />
                              <span>{reminder.time}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteReminder(reminder.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl">
                      <CalendarIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>이 날짜에는 알림이 없습니다</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Reminders List */
        loading && reminders.length === 0 ? (
          <div className="flex items-center justify-center py-12 bg-white rounded-2xl shadow-lg">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-10 h-10 text-purple-400" />
            </div>
            <p className="text-gray-900 mb-2">등록된 알림이 없습니다</p>
            <p className="text-sm text-gray-500">위의 버튼을 눌러 첫 알림을 추가해보세요</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
                      <span className="text-2xl">💊</span>
                    </div>
                    <div>
                      <h4 className="text-gray-900">{reminder.supplement}</h4>
                      <div className="flex items-center gap-1 text-sm text-purple-600">
                        <Clock className="w-4 h-4" />
                        <span>{reminder.time}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteReminder(reminder.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {reminder.days.map((day) => (
                    <span
                      key={day}
                      className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm"
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}