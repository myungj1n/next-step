// Application layer: the "Your next step" advice on the details page. One title and a
// few concrete tips per stage, so there's always one clear thing to do. Pure function.
import { ApplicationStatus, STATUS_STAGES } from '../models/Application.js'
import { WAITING_DAYS } from './applicationQuery.js'

const DAY_MS = 86_400_000

function daysSince(createdAt, now) {
  const ms = createdAt ? new Date(createdAt).getTime() : NaN
  return Number.isNaN(ms) ? null : Math.floor((now.getTime() - ms) / DAY_MS)
}

// The stage after this one on the path, or null at Offer and for closed applications.
export function nextStage(status) {
  const index = STATUS_STAGES.indexOf(status)
  return index >= 0 && index < STATUS_STAGES.length - 1 ? STATUS_STAGES[index + 1] : null
}

// { title, tips: string[] } for an application.
export function nextStepFor(application, now = new Date()) {
  const { company, status, createdAt } = application

  switch (status) {
    case ApplicationStatus.APPLIED: {
      const days = daysSince(createdAt, now)
      if (days !== null && days >= WAITING_DAYS) {
        return {
          title: `It's been ${days} days: send a follow-up`,
          tips: [
            `Write two or three lines to the recruiter or hiring team at ${company}: the role, when you applied, and that you're still interested.`,
            'Mention one thing you did recently that fits the role.',
            'No reply in another week? Mark it withdrawn and put the time into new applications.',
          ],
        }
      }
      return {
        title: 'Wait for a reply, and keep applying',
        tips: [
          `Most companies reply within 1 to 3 weeks. If ${company} hasn't by then, send a short follow-up.`,
          'Look for someone at the company to ask about the team or for a referral.',
          'Note which resume version you sent, so you can see which one gets replies.',
        ],
      }
    }
    case ApplicationStatus.PHONE_CALL:
      return {
        title: 'Prepare for the phone call',
        tips: [
          `Rehearse a 60-second intro: who you are, what you've built, why ${company}.`,
          'Have two questions ready about the team and the internship project.',
          'Keep the job posting open during the call.',
        ],
      }
    case ApplicationStatus.INTERVIEW:
      return {
        title: 'Prepare for the interview',
        tips: [
          'Ask the recruiter what the interview covers: coding, system design, or behavioral.',
          'Practice a few problems out loud, the way you would explain them to an interviewer.',
          'Prepare two stories about projects: the problem, what you did, and the result.',
        ],
      }
    case ApplicationStatus.FINAL_INTERVIEW:
      return {
        title: 'Prepare for the final round',
        tips: [
          'Look back at your notes from earlier rounds and what the interviewers cared about.',
          `Prepare a clear answer to why ${company}, and why this team.`,
          'Send a short thank-you note to each interviewer within a day.',
        ],
      }
    case ApplicationStatus.OFFER:
      return {
        title: 'Review the offer',
        tips: [
          'Check the deadline to accept, and ask for more time if you are waiting on other companies.',
          'Compare pay, location, start date, and the team you would join.',
          'Once you decide, mark your other open applications as withdrawn.',
        ],
      }
    case ApplicationStatus.REJECTED:
      return {
        title: 'Take what you can from it',
        tips: [
          'Write down what was asked and what you would answer differently next time.',
          'If you got to an interview, it is fine to ask the recruiter for brief feedback.',
          'Many companies let you apply again next season. Add a note to try again.',
        ],
      }
    default:
      return {
        title: 'This application is closed',
        tips: ['Pick a stage above if you want to reopen it.'],
      }
  }
}
