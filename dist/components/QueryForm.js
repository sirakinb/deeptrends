'use client';
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryForm = QueryForm;
const react_1 = __importStar(require("react"));
const react_2 = require("@headlessui/react");
const outline_1 = require("@heroicons/react/24/outline");
const axios_1 = __importDefault(require("axios"));
const frequencies = [
    { id: 'immediate', name: 'Immediate' },
    { id: 'daily', name: 'Daily' },
    { id: 'weekly', name: 'Weekly' },
];
const weekDays = [
    { id: 'monday', name: 'Monday' },
    { id: 'tuesday', name: 'Tuesday' },
    { id: 'wednesday', name: 'Wednesday' },
    { id: 'thursday', name: 'Thursday' },
    { id: 'friday', name: 'Friday' },
    { id: 'saturday', name: 'Saturday' },
    { id: 'sunday', name: 'Sunday' },
];
const models = [
    { id: 'sonar-deep-research', name: 'Sonar Deep Research' },
    { id: 'sonar-pro', name: 'Sonar Pro' },
];
function QueryForm({ onSubmit }) {
    const [formData, setFormData] = (0, react_1.useState)({
        query: '',
        model: 'sonar-pro',
        frequency: 'immediate',
        time: '09:00',
        week_day: 'monday',
    });
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [loadingStage, setLoadingStage] = (0, react_1.useState)('');
    const [progress, setProgress] = (0, react_1.useState)(0);
    const [result, setResult] = (0, react_1.useState)(null);
    const [error, setError] = (0, react_1.useState)(null);
    const [isSubmitting, setIsSubmitting] = (0, react_1.useState)(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting)
            return;
        try {
            setIsSubmitting(true);
            setLoading(true);
            setResult(null);
            setError(null);
            setProgress(20);
            // Send query to backend
            const response = await axios_1.default.post('/api/query', {
                query: formData.query,
                model: formData.model,
                ...(formData.frequency !== 'immediate' && {
                    schedule: {
                        frequency: formData.frequency,
                        time: formData.time,
                        week_day: formData.week_day,
                        next_run: new Date().toISOString()
                    }
                })
            });
            setLoadingStage('Synthesizing research findings...');
            setProgress(80);
            // If immediate, show the result
            if (formData.frequency === 'immediate') {
                setResult(response.data.result);
                setLoadingStage('Research complete!');
                setProgress(100);
            }
            else {
                // For scheduled queries, notify the parent component
                onSubmit({
                    id: response.data.scheduleId,
                    query: formData.query,
                    frequency: formData.frequency,
                    time: formData.time,
                    week_day: formData.week_day,
                    model: formData.model,
                    is_active: true,
                    status: 'scheduled',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
                // Show success message
                setResult('Schedule created successfully!');
                // Reset form for scheduled queries
                resetForm();
            }
        }
        catch (error) {
            console.error('Error submitting query:', error);
            setError(error.response?.data?.error || 'An unexpected error occurred');
        }
        finally {
            setLoading(false);
            setIsSubmitting(false);
            setProgress(0);
        }
    };
    const resetForm = () => {
        setFormData({
            query: '',
            model: 'sonar-pro',
            frequency: 'immediate',
            time: '09:00',
            week_day: 'monday',
        });
    };
    const selectedFrequency = frequencies.find(f => f.id === formData.frequency);
    const selectedWeekDay = weekDays.find(d => d.id === formData.week_day);
    const selectedModel = models.find(m => m.id === formData.model);
    return (<form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="query" className="block text-sm font-medium mb-1">
            Research Query
          </label>
          <textarea id="query" rows={4} className="input-field w-full" value={formData.query} onChange={(e) => setFormData({ ...formData, query: e.target.value })} placeholder="Enter your research query..." required disabled={loading}/>
        </div>

        <div>
          <react_2.Listbox value={selectedModel} onChange={(model) => setFormData({ ...formData, model: model.id })} disabled={loading}>
            <div className="relative">
              <react_2.Listbox.Label className="block text-sm font-medium mb-1">Model</react_2.Listbox.Label>
              <react_2.Listbox.Button className="input-field w-full text-left flex justify-between items-center">
                <span>{selectedModel?.name}</span>
                <outline_1.ChevronUpDownIcon className="h-5 w-5 text-gray-400"/>
              </react_2.Listbox.Button>
              <react_2.Listbox.Options className="absolute z-10 mt-1 w-full bg-gray-800 rounded-md shadow-lg max-h-60 overflow-auto focus:outline-none">
                {models.map((model) => (<react_2.Listbox.Option key={model.id} value={model} className={({ active }) => `relative cursor-pointer select-none py-2 px-4 ${active ? 'bg-blue-600' : ''}`}>
                    {model.name}
                  </react_2.Listbox.Option>))}
              </react_2.Listbox.Options>
            </div>
          </react_2.Listbox>
        </div>

        <div>
          <react_2.Listbox value={selectedFrequency} onChange={(frequency) => setFormData({ ...formData, frequency: frequency.id })} disabled={loading}>
            <div className="relative">
              <react_2.Listbox.Label className="block text-sm font-medium mb-1">Frequency</react_2.Listbox.Label>
              <react_2.Listbox.Button className="input-field w-full text-left flex justify-between items-center">
                <span>{selectedFrequency?.name}</span>
                <outline_1.ChevronUpDownIcon className="h-5 w-5 text-gray-400"/>
              </react_2.Listbox.Button>
              <react_2.Listbox.Options className="absolute z-10 mt-1 w-full bg-gray-800 rounded-md shadow-lg max-h-60 overflow-auto focus:outline-none">
                {frequencies.map((frequency) => (<react_2.Listbox.Option key={frequency.id} value={frequency} className={({ active }) => `relative cursor-pointer select-none py-2 px-4 ${active ? 'bg-blue-600' : ''}`}>
                    <div>
                      <div className="font-medium">{frequency.name}</div>
                    </div>
                  </react_2.Listbox.Option>))}
              </react_2.Listbox.Options>
            </div>
          </react_2.Listbox>
        </div>

        {formData.frequency !== 'immediate' && (<div className="space-y-4">
            <div>
              <label htmlFor="time" className="block text-sm font-medium mb-1">
                Time (EST)
              </label>
              <input type="time" id="time" className="input-field w-full" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} required disabled={loading}/>
            </div>

            {formData.frequency === 'weekly' && (<div>
                <react_2.Listbox value={selectedWeekDay} onChange={(day) => setFormData({ ...formData, week_day: day.id })} disabled={loading}>
                  <div className="relative">
                    <react_2.Listbox.Label className="block text-sm font-medium mb-1">Day of Week</react_2.Listbox.Label>
                    <react_2.Listbox.Button className="input-field w-full text-left flex justify-between items-center">
                      <span>{selectedWeekDay?.name}</span>
                      <outline_1.ChevronUpDownIcon className="h-5 w-5 text-gray-400"/>
                    </react_2.Listbox.Button>
                    <react_2.Listbox.Options className="absolute z-10 mt-1 w-full bg-gray-800 rounded-md shadow-lg max-h-60 overflow-auto focus:outline-none">
                      {weekDays.map((day) => (<react_2.Listbox.Option key={day.id} value={day} className={({ active }) => `relative cursor-pointer select-none py-2 px-4 ${active ? 'bg-blue-600' : ''}`}>
                          {day.name}
                        </react_2.Listbox.Option>))}
                    </react_2.Listbox.Options>
                  </div>
                </react_2.Listbox>
              </div>)}
          </div>)}

        {loading && (<div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300">{loadingStage}</span>
              <span className="text-sm text-gray-400">{progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}/>
            </div>
          </div>)}

        <button type="submit" className={`btn-primary w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={loading}>
          {loading ? 'Researching...' : formData.frequency === 'immediate' ? 'Run Query Now' : 'Create Schedule'}
        </button>

        {error && (<div className="mt-4 p-4 bg-red-900/50 rounded-lg border border-red-700">
            <h3 className="text-sm font-medium text-red-400 mb-1">Error</h3>
            <div className="text-red-100">{error}</div>
          </div>)}

        {result && (<div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Result</h3>
            <div className="text-gray-200 whitespace-pre-wrap">{result}</div>
          </div>)}
      </div>
    </form>);
}
